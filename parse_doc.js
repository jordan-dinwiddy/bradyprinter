/**
 * Reads in the raw data payload sent to the Brady M611 printer
 * on port 9100. 
 * 
 * It seems the raw document is all that's necessary to print
 * a file on the printer and it can be replicated with the 
 * follow netcat:
 * 
 * cat file-port-9100.bin | nc 192.168.0.94 9100
 * 
 * 
 */

/**
 * File Format:
 * 
 * Each input file can have multiple 'segments' where a segment consists of
 * a 20 byte header followed immediately by an ASCII encoded JSON document.
 * 
 * 20 bytes header
 *  bytes 0-4: 7F42EE41
 *  bytes 4-8: A91D4090
 *  bytes 8-12: 9BECFF7A
 *  bytes 12-16: 6614CC22
 *  bytes 16:20: size of data payload, integer in Little Endian
 *
 * In the data data part of the segment, the JSON document can optionally detail
 * a "Pages" node which contains a "Layers" node array where each element contains a "Bitmap" key.
 * The value of this key appears to be base64 binary encoded. Decoding the base64 payload the first
 * few bytes of the the bitmap are consistently:
 * 51424D66 23000100 F1043E00 00002800 0000C201 00006AFF FFFF0100 01180013 2820000C
 * in Asci that translates to:
 * QBMf#  ñ>   (   Â  jÿÿÿ  (  
 */

const fs = require('fs');
const FileType = require('file-type');
const LZ4 = require('lz4')

const filename = process.argv[2];
const outBitmapFilename = process.argv[3];

if(!outBitmapFilename) {
    console.error('No output bitmap file specified');
    return;
}

console.log(`Input filename: ${filename}`);
console.log(`Output bitmap filename: ${outBitmapFilename}`);

const buffer = fs.readFileSync(filename);

const fileSize = buffer.length;
console.log(`Filesize (bytes): ${fileSize}\n\n`);


let ix = 0;
while(true) {
    console.log(`reading 20 bytes at ix=${ix}`);
    let headerBuffer = buffer.slice(ix, ix + 20);
    console.log(headerBuffer);

    let dataSize = headerBuffer.readUInt32LE(16);
    console.log(`First segment at offset ${ix}, dataSize=${dataSize}`);
    let dataBuffer = buffer.slice(ix + 20, ix + 20 + dataSize);
    let document = JSON.parse(dataBuffer.toString());
    

    
    console.log(JSON.stringify(document, null, 4));
    
    let pagesDoc = document["Pages"];
    if(pagesDoc) {
        console.log('Attempting to parse Bitmap');
        let bitmapBase64 = pagesDoc["Layers"][0]["Bitmap"];

        let bitmapBuffer = Buffer.from(bitmapBase64, 'base64');
        (async() => {
            console.log('trying to figure out...')
            console.log(await FileType.fromBuffer(buffer));
            console.log('done');
        })();
        
        console.log(`Bitmap size: ${bitmapBuffer.length} bytes`);
        console.log(`First 10 bytes of bitmap: ${bitmapBuffer.slice(0, 10).toString('hex')} (${bitmapBuffer.slice(0, 10).toString()})`);
        fs.writeFile(outBitmapFilename + '.lz4', bitmapBuffer, 'binary', (e) => {
            if(e) {
                console.log('Unable to write output bitmap');
            } else {
                console.log('Successfully wrote output LZ4');
            }
        });

        let uncompressed = Buffer.alloc(10000);
        const uncompressedSize = LZ4.decodeBlock(bitmapBuffer, uncompressed);
        uncompressed = uncompressed.slice(0, uncompressedSize);

        console.log(`Uncompressed size: ${uncompressedSize}`);
        fs.writeFile(outBitmapFilename, uncompressed, 'binary', (e) => {
            if(e) {
                console.log('Unable to write output bitmap');
            } else {
                console.log('Successfully wrote output bitmap');
            }
        });

    }

    
    ix += 20 + dataSize;

    if(ix >= fileSize) {
        break;
        console.log('exiting...');
    }
}
