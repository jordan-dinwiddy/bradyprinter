/**
 * 1. Read in uncompressed bitmap file
 * 2. Compress using LZ4
 * 3. Base64 encode
 * 4. Generate first JSON doc
 * 5. Pack JSON doc into segment with binary header
 * 6. Generate second JSON doc
 * 7. Pack JSON doc into segment with binary header
 * 8. Combine 5+7 and write to stdout
 */


 const fs = require('fs');
 const FileType = require('file-type');
 const LZ4 = require('lz4')
 
 const inputFilename = process.argv[2];
 const outputFilename = process.argv[3];



console.log(`Input bitmap file: ${inputFilename}`);
console.log(`Output file: ${outputFilename}`);

const bitmapBuffer = readAndCompressFile(inputFilename);

const segmentA = packSegment({
  "JobID": "26893939b09549319f85cae53efee69d",
  "JobName": "New Label 2.BWS",
  "JobTime": "20211028123441",
  "NumberOfPages": 1,
  "SubstratePart": "M61-117-492",
  "JobType": "Print"
});

const segmentB = packSegment({
  "PrintFileName":" Page1.prn",
  "JobID": "26893939b09549319f85cae53efee69d",
  "PageNumber": 0,
  "LabelWidth": 1500,
  "LabelHeight": 500,
  "Pages":{
    "Layers":[
      {
        "Bitmap": bitmapBuffer.toString('base64'),
        "Compression":"lz4",
      }
    ],
    "PrePrintOperations":[],
    "PostPrintOperations":[{ "Cut":"shear" }],
  }
});

const outputBuffer = Buffer.concat([ segmentA, segmentB ]);
fs.writeFile(outputFilename, outputBuffer, 'binary', (e) => {
  if(e) {
      console.log('Unable to write output file');
  } else {
      console.log('Successfully wrote output file');
  }
});



function readAndCompressFile(filename) {
  const inputBuffer = fs.readFileSync(filename);
  console.log(`Input file size (bytes): ${inputBuffer.length}`);

  let outputBuffer = Buffer.alloc(LZ4.encodeBound(inputBuffer.length));
  const compressedSize = LZ4.encodeBlock(inputBuffer, outputBuffer);
  console.log(`Compressed file size (bytes): ${compressedSize}`);
  outputBuffer = outputBuffer.slice(0, compressedSize);

  return outputBuffer;
}

function packSegment(json) {
  const jsonStr = JSON.stringify(json);
  const payloadSize = jsonStr.length;   // May not account for \ escapes

  const buffer = Buffer.alloc(20 + payloadSize);
  buffer.writeUInt32BE(0x7F42EE41, 0);
  buffer.writeUInt32BE(0xA91D4090, 4);
  buffer.writeUInt32BE(0x9BECFF7A, 8);
  buffer.writeUInt32BE(0x6614CC22, 12);
  buffer.writeUInt32LE(payloadSize, 16);

  buffer.write(jsonStr, 20, 'ascii');

  return buffer;
}
