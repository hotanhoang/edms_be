const fs = require("fs");

function mkdirDoc(path, index = 0) {
  const pathDir = `${path}${index !== 0 ? `(${index})` : ""}`;
  if (!fs.existsSync(pathDir)) {
    fs.mkdirSync(pathDir);
    return pathDir;
  } else {
    return mkdirDoc(path, ++index);
  }
}

module.exports = {
  mkdirDoc,
};
