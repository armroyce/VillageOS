const CryptoJS = require('crypto-js');

const SECRET = process.env.AES_SECRET_KEY || 'villageos-aes-key-32-chars-here!';

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
