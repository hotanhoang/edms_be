const { onError, onSuccess } = require("../utils/utils");
const { docConfig, users } = require("../models/init-models");
const { ROLE_TYPES } = require("../utils/constants");


module.exports = {
    get_config: async (req, res) => {
        try {
            const config = await docConfig.findAll();

            if (config.length === 0) {
                const newConfig = await docConfig.create({
                    maxCapacity: 2,
                    maxFileSize: 25,
                });
                return res.send(onSuccess({ config: newConfig }))
            }
            return res.send(onSuccess({ config: config[0] }))
        } catch (error) {
            // console.log("error: ", error)
            return res.send(onError(500, error));
        }
    },
    edit_config: async (req, res) => {
        try {
            const { userId } = req.user;
            const { id } = req.params;
            // console.log("id: ", id)
            const { maxCapacity, maxFileSize } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    //Kiem tra docConfig
                    const config = await docConfig.findOne({
                        where: {
                            id: id
                        }
                    });
                    if (config !== null) {
                        config.maxCapacity = parseInt(maxCapacity);
                        config.maxFileSize = parseInt(maxFileSize);
                        await config.save()
                        return res.send(onSuccess({ id: config.id }))
                    }
                }
            }
        } catch (error) {
            // console.log("error: ", error)
        }
    }
}