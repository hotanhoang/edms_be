const { activityLogs, action } = require("../models/init-models");
module.exports = {
  // Hàm ghi log vào CSDL
  logAction: async (actionId, data) => {
    const result = await activityLogs.create({
      actionId,
      ...data,
    });
    return result;
  },
};
