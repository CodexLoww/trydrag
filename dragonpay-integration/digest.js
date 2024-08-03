const fs = require('fs');
const crypto = require('crypto');
const config = require('./config');

// Data to generate digest
const txnid = '24307f9bd1e01edd40d479228336a923e5075e2e';
const status = 'P';
const refno = 'D3UA64PRA2';

// Generate the digest
const digestString = `${txnid}:${refno}:${status}:${config.secretKey}`;
const digest = crypto.createHash('sha1').update(digestString).digest('hex');

// Write the digest to a text file
fs.writeFileSync('digest.txt', digest);

console.log('Digest:', digest);
