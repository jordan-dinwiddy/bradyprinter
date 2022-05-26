# Brady Printer Utils

# Files
* Really the only source file you need is `create-image2.js`. That does all the work. The other `*.js` files were purely experimental but I've left in because they contain some comments and documentation that might be useful in understanding the Brady Printer protocol. 

# Installation
* `cd .`
* `npm install`

# Steps to Run
* `node create-image2.js "Label Text Here"

Running the above command will generate a new monochrome bitmap of the correct dimensions, compress it using LZ4, generate a new JSON document describing the print job and then attempt to write the serialized JSON over UDP to the IP address / port detailed on line 95. 

-----------------
Jordan Dinwiddy
26 May 2022