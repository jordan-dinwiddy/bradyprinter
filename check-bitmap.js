const fs = require('fs');



const inputFilename = process.argv[2];

console.log(`Input bitmap file: ${inputFilename}`);

const inputBuffer = fs.readFileSync(inputFilename);
console.log(`Input bitmap filesize: ${inputBuffer.length}`);

// First 14 bytes are general bitmap header
describeField('Header', inputBuffer.slice(0, 2), Buffer.from([0x42, 0x4d]))
describeFieldP('Bitmap size', () => inputBuffer.readUInt32LE(2));
describeField('Reserved', inputBuffer.slice(6, 8));
describeField('Reserved', inputBuffer.slice(8, 10));
describeFieldP('Pixel array offset', () => inputBuffer.readUInt32LE(10));

// For type BITMAPINFOHEADER, the next 40 bytes is the DIP header
describeFieldP('DIP header size', () => inputBuffer.readUInt32LE(14));
describeFieldP('Bitmap width', () => inputBuffer.readInt32LE(18));
describeFieldP('Bitmap height', () => inputBuffer.readInt32LE(22));
describeFieldP('# Color Planes',  () => inputBuffer.readUInt16LE(26));
describeFieldP('Bits per pixel',  () => inputBuffer.readUInt16LE(28));
describeField('Compression method', inputBuffer.slice(30, 34));
describeFieldP('Image size',  () => inputBuffer.readUInt32LE(34));
describeFieldP('Horizontal res', () => inputBuffer.readInt32LE(38));
describeFieldP('Vertical res', () => inputBuffer.readInt32LE(42));
describeFieldP('# color pallette', () => inputBuffer.readUInt32LE(46));


const colorTableStart = 14 + 40;                    // 54
const colorTableEnd = inputBuffer.readUInt32LE(10); // 62
console.log(`Color table actual size (bytes): ${colorTableEnd - colorTableStart}`);
console.log(`Color table expected size: ${(Math.pow(2,inputBuffer.readUInt16LE(28))) * 4}`)
describeField('Color Table', inputBuffer.slice(colorTableStart, inputBuffer.readUInt32LE(10)));

function describeField(label, fieldBuffer, expectedBuffer) {
    let matchesResult = "";
    if(expectedBuffer) {
        matchesResult = `(${Buffer.compare(fieldBuffer, expectedBuffer) == 0 ? 'OK' : 'UNEXPECTED'})`;
    }
    console.log(`${label} field: 0x${fieldBuffer.toString('hex')} (${fieldBuffer.toString('ascii')}) ${matchesResult}`);
}

function describeFieldP(label, parserFunc) {
    console.log(`${label} field: ${parserFunc()}`);
}
