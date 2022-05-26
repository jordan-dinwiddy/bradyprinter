# Brady Printer Utils

# Files
Really the only source file you need is `create-image2.js`. That does all the work. The other `*.js` files were purely experimental but I've left in because they contain some comments and documentation that might be useful in understanding the Brady Printer protocol. 

# Installation
First install the NodeJS runtime if you don't already have it. This code was tested using node `v12.16.2`. You can use the node version manager (nvm) to install specific node versions. 

* `cd .`
* `npm install`

# Steps to Run
* `node create-image2.js "Label Text Here"`

Running the above command will generate a new monochrome bitmap of the correct dimensions, compress it using LZ4, generate a new JSON document describing the print job and then attempt to write the serialized JSON over UDP to the IP address / port detailed on line 95. 

# Data format
```
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
 */
 ```

-----------------
Jordan Dinwiddy - 
26 May 2022