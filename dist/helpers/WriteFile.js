"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteFile = void 0;
const fs = require('file-system');
const WriteFile = async (filename, content) => {
    // write product info of updated products to file (and send an email to employee)
    fs.writeFile(`writefiles/${filename}.txt`, JSON.stringify(content));
    // SendEmail("Updated products")
};
exports.WriteFile = WriteFile;
