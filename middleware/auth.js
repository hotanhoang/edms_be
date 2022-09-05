const { onError } = require("../utils/utils");
// const { users } = require("../models/init-models");
module.exports = async (req, res, next) => {
  if (req.user) {
    if (req.user.enable) {
      next();
    } else {
      return res.send(onError(400, "Tài khoản đã bị khoá"));
    }
  } else {
    return res.send(onError(401, "Unauthorized user!"));
  }
};
