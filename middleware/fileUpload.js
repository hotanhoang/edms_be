const { fileFilter, editFileName } = require("../utils/fileUpload");
const multer = require("multer");
const maxSize = 25 * 1024 * 1024;
const path = require("path");
const { USER_UPLOAD_DOCS, FILE_KEY_TOPIC } = require("../utils/constants");

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, `${USER_UPLOAD_DOCS}/${req.user.userId}`);
  },
  filename: editFileName,
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: fileFilter,
}).single("file");

let storageMutilSum = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, `${USER_UPLOAD_DOCS}/${req.user.userId}`);
  },
  filename: editFileName,
});

let uploadFileSum = multer({
  storage: storageMutilSum,
  limits: { fileSize: maxSize },
  fileFilter: fileFilter,
}).any();

let storageTopic = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, `${FILE_KEY_TOPIC}`);
  },
  filename: editFileName,
});

let uploadFileTopic = multer({
  storage: storageTopic,
  limits: { fileSize: maxSize },
  fileFilter: fileFilter,
}).any();


module.exports = { uploadFile, uploadFileTopic, uploadFileSum };
