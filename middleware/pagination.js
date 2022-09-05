const { onError } = require("../utils/utils");
const { PAGINATION_CONSTANTS } = require("../utils/constants");
module.exports = async (req, res, next) => {
  if (req.user) {
    if (req.user.enable) {
      let pageSize = req.query.pageSize
        ? req.query.pageSize
        : PAGINATION_CONSTANTS.default_size;
      let pageIndex = req.query.pageIndex
        ? req.query.pageIndex
        : PAGINATION_CONSTANTS.default_index;

      let page = parseInt(pageIndex.toString());
      let limit = parseInt(pageSize.toString());
      let offset = limit * (page - 1);

      req.pagination = {
        page,
        limit,
        offset,
      };
      next();
    } else {
      return res.send(onError(400, "Tài khoản đã bị khoá"));
    }
  } else {
    return res.send(onError(403, "Unauthorized user!"));
  }
};
