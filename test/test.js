const blockify = require("../index.js");
const fs = require("fs");
(async () => {
  fs.writeFileSync("exampleBlockified.png", await blockify("./example.png"));
})();
