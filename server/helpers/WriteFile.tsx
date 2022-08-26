const fs = require('file-system');

export const WriteFile = async(filename : string, content : Array<object>) => {
    // write product info of updated products to file (and send an email to employee)
    fs.writeFile(`writefiles/${filename}.txt`, JSON.stringify(content))
    // SendEmail("Updated products")

}