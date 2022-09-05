const path = require("path");
const fs = require("fs");
const sha256 = require("sha256");
const { hashesID } = require("./utils");

const pattern = /(\.\.\/)/g;
module.exports = {
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(doc|docx|pdf|rtf)$/)) {
      return callback("Định dạng file không được phép", false);
    }
    callback(null, true);
  },

  editFileName(req, file, callback) {
    const fileExtName = path.extname(file.originalname);
    // const date = new Date().getTime().toString();
    // const timestamp = Math.floor(new Date().getTime() / 1000);
    const documentId = hashesID(file.originalname);
    callback(null, `${documentId}${fileExtName}`);
  },
  getSizeOfFile(size) {
    var hz;
    if (size < 1024) hz = size + " B";
    else if (size < 1024 * 1024) hz = (size / 1024).toFixed(2) + " KB";
    else if (size < 1024 * 1024 * 1024)
      hz = (size / 1024 / 1024).toFixed(2) + " MB";
    else hz = (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
    return hz;
  },

  //Hàm lấy thông tin chi tiết của file trên ổ đĩa
  fileDetails(req, res) {
    const path = req.file.path;
    return new Promise((resolve, reject) => {
      var cwd = {};
      fs.stat(path, function (err, stats) {
        cwd.size = Math.floor(stats.size / 1000);
        cwd.isFile = stats.isFile();
        cwd.modified = stats.ctime;
        cwd.created = stats.mtime;
        resolve(cwd);
      });
    });
  },

  //Hàm lấy kích thước của folder
  getFolderSize(req, res, directory, sizeValue) {
    var size = sizeValue;
    var filenames = fs.readFileSync(directory);
    for (var i = 0; i < filenames.length; i++) {
      if (fs.lstatSync(directory + "/" + filenames[i]).isDirectory()) {
        getFolderSize(req, res, directory + "/" + filenames[i], size);
      } else {
        const stats = fs.statSync(directory + "/" + filenames[i]);
        size = size + stats.size;
      }
    }
    return size;
  },
};
