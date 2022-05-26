const { createCanvas, loadImage, Path2D } = require('canvas')
const fs = require('fs');
var im = require('imagemagick');
const FileType = require('file-type');
const LZ4 = require('lz4')
const net = require('net');
const { Socket } = require('dgram');
const { v4: uuidv4 } = require('uuid');

const label = process.argv[2];
console.log(`Label: ${label}`);

const canvas = createCanvas(450, 150)
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 450, 150);

// Write "Awesome!"
ctx.fillStyle = 'black';
ctx.font = '30px Arial'
ctx.fillText(label, 45, 85)

var text = ctx.measureText(label)
ctx.strokeStyle = 'rgba(0,0,0,1)'
ctx.lineWidth = 3;
ctx.beginPath()
ctx.lineTo(45, 90)
ctx.lineTo(45 + text.width, 90)
ctx.stroke()

ctx.fillRect(225, 60, 40, 40);

ctx.fillRect(350, 60, 40, 40);


fs.writeFileSync('test.png', canvas.toBuffer());


im.convert(
    ['test.png', '-define', 'bmp:format=bmp3', '-monochrome', 'test.bmp'],
    (e, stdout) => {
        console.log(e);
        console.log(stdout);
        runStage2();
    }
);

function runStage2() {
    const bitmapBuffer = readAndCompressFile('test.bmp');

    const jobId = uuidv4().replace(/-/g, '');
    console.log(`Job ID: ${jobId}`);
    
    const segmentA = packSegment({
      "JobID": jobId,
      "JobName": "New Label 2.BWS",
      "JobTime": "20211028123441",
      "NumberOfPages": 1,
      "SubstratePart": "M61-117-492",
      "JobType": "Print"
    });
    
    const segmentB = packSegment({
      "PrintFileName":" Page1.prn",
      "JobID": jobId,
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
    fs.writeFile('output.bin', outputBuffer, 'binary', (e) => {
      if(e) {
          console.log('Unable to write output file');
          console.log('output.bin');
      } else {
          console.log('Successfully wrote output file');
      }
    });
    
    
    console.log('Attempting to write payload to socket');
    const client = new net.Socket();
    client.connect(9100, "192.168.0.94");
    
    client.write(outputBuffer, () => {
        console.log('socket write finished');
        client.destroy();
    });
}


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