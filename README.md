# blockify
Replaces pixels in an image with Minecraft blocks!

## Usage
```js
// {image} can be a buffer, url to file, or image url
await blockify(image)

// returns an image buffer
```

## Example
```js
const blockify = require('blockify');
const fs = require('fs');

fs.writeFileSync('exampleBlockified.png', await blockify('./example.png'));
```