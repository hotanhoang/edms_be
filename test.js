const WordExtractor = require("word-extractor");
const fs = require("fs");
const pdf = require('pdf-parse');

const parseRTF = require('@extensionengine/rtf-parser');
const { readFileSync } = require('fs');
const crypto = require('crypto')

const extractor = new WordExtractor();

async function readDocx() {
    const doc = await extractor.extract("test.docx")
    // console.log(doc.getBody())
}
// readDocx()

async function readPdf() {
    let dataBuffer = fs.readFileSync('test.pdf');
    const doc = await pdf(dataBuffer)
    // console.log(doc.text)
}

async function readRtf() {
    const rtf = readFileSync('Tài liệu triển khai SingSing.rtf');
    const rtfdoc = await parseRTF(rtf) // .then(rtfdoc => console.log({ rtfdoc }));
    // const text = await parseRTF.stream(fs.createReadStream('edms.rtf'))
    // let text = ""
    rtfdoc.content.forEach(e => {
        // e.content.forEach(a => {
        //     text += a.value
        // });
        // console.log(e)

    });
}

var filename = 'documents/627ecbd0ee11cb158f26cf82/62eeeff067e34fe9ac2dab7e.pdf'
var md5sum = crypto.createHash('md5')
var s = fs.ReadStream(filename);
s.on('data', function (d) {
    md5sum.update(d);
});

s.on('end', function () {
    var d = md5sum.digest('hex');
    // console.log(d + '  ' + filename);
});