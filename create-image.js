const Jimp = require('jimp');
const bmp = require('bmp-ts').default;
const fs = require('fs');

new Jimp(450, 150, (err, image) => {
    // this image is 256 x 256, every pixel is set to 0x00000000


    Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
        image
            .greyscale()
            .background( 0xffffffff )
            .print(font, 10, 50, 'Hello world!')
            .getBufferAsync(Jimp.MIME_BMP).then((data) => {

                const bmpData = {
                    data, // Buffer
                    bitPP: 1, // The number of bits per pixel
                    width: 450, // Number
                    height: 150 // Number
                  };

                  const rawData = bmp.encode(bmpData);
                fs.writeFileSync('./image.bmp', rawData.data);

                console.log('done');
            });
            
            /**
             *  .writeAsync('testfile.bmp').then((e) => {
                console.log(e);
                console.log('done!');
            });
            */
      });


});
