const Canvas = require("canvas");
const jimp = require("jimp");
const colorDiff = require("color-diff");
const path = require("path");
const https = require("https");
const sizeOf = require("image-size");
const fs = require("fs");

const blocks = require("./blocks.json");
const palette = [];
Object.keys(blocks).forEach((color) => {
  const p = color.split(",");
  palette.push({ R: p[0], G: p[1], B: p[2] });
});

module.exports = blockify = async (url) => {
  if (!url)
    throw new Error(`Blockify | You must specify an image to blockify.`);
  return new Promise(async (resolve) => {
    let urlTest;
    let isURL = true;
    let dimension;

    try {
      urlTest = new URL(string);
    } catch (_) {
      isURL = false;
    }

    if (
      isURL &&
      (urlTest.protocol === "http:" || urlTest.protocol === "https:")
    ) {
      https
        .get(url, function (response) {
          const chunks = [];
          response
            .on("data", function (chunk) {
              chunks.push(chunk);
            })
            .on("end", function () {
              try {
                dimension = sizeOf(Buffer.concat(chunks));
              } catch (err) {
                return console.error(`Blockify | ${err}`);
              }
            });
        })
        .on("error", function (error) {
          console.error(error);
          if (error.toString().startsWith("Error: connect ECONNREFUSED"))
            return console.error(`Blockify | ${url} is not supported.`);
        });
    } else if (fs.existsSync(url) || Buffer.isBuffer(url)) {
      try {
        dimension = sizeOf(url);
      } catch (err) {
        return console.error(`Blockify | ${err}`);
      }
    } else {
      return console.error(`Blockify | ${url} is not a valid image.`);
    }

    let resizedImage, resizedSize;
    if (dimension.width > 64 || dimension.height > 64) {
      let ratio;
      if (dimension.width > dimension.height) {
        ratio = (dimension.width / 64).toFixed(0);
      } else {
        ratio = (dimension.height / 64).toFixed(0);
      }

      const width = Number((dimension.width / ratio).toFixed(0));
      const height = Number((dimension.height / ratio).toFixed(0));

      const img = await jimp.read(url);
      await img.resize(width, height);

      resizedSize = {
        width: Number(img.bitmap.width.toFixed(0)),
        height: Number(img.bitmap.height.toFixed(0)),
      };
      resizedImage = await img.getBufferAsync(jimp.MIME_PNG);
    }

    const width = resizedSize?.width || dimension.width;
    const height = resizedSize?.height || dimension.height;

    const canvasStart = Canvas.createCanvas(width, height);
    const canvasStartCTX = canvasStart.getContext("2d");
    canvasStartCTX.drawImage(await Canvas.loadImage(resizedImage || url), 0, 0);

    // times 16 because that is the size of the block textures
    const canvasResult = Canvas.createCanvas(width * 16, height * 16);
    const canvasResultCTX = canvasResult.getContext("2d");

    const imageData = canvasStartCTX.getImageData(0, 0, width, height).data;

    let x,
      y,
      i = 0;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        const index = i * 4;
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];
        const a = imageData[index + 3] / 255;

        const color = colorDiff.closest({ R: r, G: g, B: b }, palette);

        const temp = await Canvas.loadImage(
          // loadedBlocks[blocks[`${color.R},${color.G},${color.B}`]]
          path.join(
            __dirname,
            `./image/${blocks[`${color.R},${color.G},${color.B}`]}`
          )
        );

        // console.log(a);

        canvasResultCTX.globalAlpha = a;

        canvasResultCTX.drawImage(temp, x * 16, y * 16);
        i++;
      }
    }
    resolve(canvasResult.toBuffer());
  });
};
