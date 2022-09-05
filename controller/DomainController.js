const { onError, onSuccess } = require("../utils/utils");
const { domain, users, topic, events } = require("../models/init-models");
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { Op, where, fn, col } = require("sequelize");


module.exports = {

    displayNameIsExisted: async (req, res) => {
        try {
            const { userId } = req.user;
            const { displayName = null } = req.query;
            if (displayName !== null) {
                const numberOfDisplayName = await domain.count({
                    where: {
                        displayName: displayName.trim(),
                        enable: true,
                        userId: userId
                    }
                });
                if (numberOfDisplayName === 0) return res.send(onSuccess({ isAvailable: true }))
                return res.send(onSuccess({ isAvailable: false }))
            }
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    getAllDomains: async (req, res) => {
        const { userId } = req.user;
        try {
            const { userId } = req.user;
            const allDomains = await domain.findAll({
                where: {
                    enable: true,
                    userId: userId
                }
            });
            // console.log("allDomains: ", allDomains)
            return res.send(onSuccess({ listDomains: allDomains }))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    //API Thêm mới lĩnh vực
    addNewDomain: async (req, res) => {
        try {
            const { userId } = req.user;
            const { displayName, description } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });

            if (userInfo && userInfo.enable) {
                //Kiểm tra xem có phải admin hay không?
                if (userInfo.roleId === ROLE_TYPES.USER) {
                    if (displayName) {
                        //Kiểm tra xem lĩnh vực đã tồn tại hay chưa
                        const domainInfo = await domain.findOne({
                            where: {
                                displayName: displayName.trim(),
                                userId: userId,
                                enable: true,
                                userId: userId
                            }
                        });
                        if (domainInfo !== null) {
                            return res.send(onError(405, 'Tên lĩnh vực đã tồn tại'))
                        }
                        const newDomain = await domain.create({
                            displayName: displayName.trim(),
                            description: description,
                            userId: userId
                        });
                        return res.send(onSuccess({ domainId: newDomain.domainId }))

                    } else {
                        return res.send(onError(402, "Tên lĩnh vực không hợp lệ"));
                    }
                }
            }
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    //API chỉnh sửa lĩnh vực
    editDomain: async (req, res) => {
        try {
            const { userId } = req.user;
            const { domainId } = req.params;
            const { displayName, enable, description } = req.body;

            //Lấy thông tin của user từ userId
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                if (userInfo.roleId === ROLE_TYPES.USER) {
                    //kiểm tra xem domainId có tồn tại hay không?
                    const domainInfo = await domain.findOne({
                        where: {
                            domainId: domainId,
                            enable: true,
                            // userId: userId,
                        }
                    });
                    if (domainInfo !== null) {
                        //Kiểm tra xem displayName của domain tồn tại hay chưa?
                        if (displayName && domainInfo.displayName !== displayName) {
                            const noDisplayName = await domain.count({
                                where: {
                                    displayName: displayName.trim(),
                                    enable: true,
                                    userId: userId
                                }
                            });
                            //Nếu displayName chưa tồn tại
                            if (noDisplayName === 0) {
                                domainInfo.displayName = displayName.trim();
                                domainInfo.description = description;
                                const updateDomain = await domainInfo.save();
                                return res.send(onSuccess({ domainId: updateDomain.domainId }))
                            } else {
                                return res.send(onError(405, "Tên khu vực đã tồn tại", {}))
                            }
                        }
                        //Xoá lĩnh vực
                        if (enable === false) {
                            domainInfo.enable = false;
                            await topic.update({
                                domainId: null
                            }, {
                                where: {
                                    domainId: domainId,
                                }
                            });
                            await events.update({
                                domainId: null,
                            }, {
                                where: {
                                    domainId: domainId,
                                }
                            })
                        }
                        //Cập nhật description
                        domainInfo.description = description;
                        await domainInfo.save();
                        return res.send(onSuccess({}))
                    } else {
                        return res.send(onError(401, "Tài khoản không có quyền", {}))
                    }
                }
            }
        } catch (error) {
            return res.send(onError(500, error))
        }
    },
    //API lấy danh sách lĩnh vực
    getListDomains: async (req, res) => {
        try {
            const { userId } = req.user;
            const pagination = req.pagination;
            const {
                domainId,
                enable = true,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
                keyword,
            } = req.query;

            let textSearch = keyword ? req.query.keyword.trim() : '';
            var filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["domainId", "DESC"]],
            };
            if (domainId) {
                filter = {
                    filter,
                    ...{
                        domainId: domainId,
                    }
                }
            }
            if (textSearch !== "") {
                var { count, rows } = await domain.findAndCountAll({
                    ...filterPagination,
                    where: {
                        displayName: where(
                            fn("LOWER", col("domain.displayName")),
                            "LIKE",
                            "%" + textSearch.toLowerCase() + "%"
                        ),
                        enable: true,
                    },
                });
            }
            else
                var { count, rows } = await domain.findAndCountAll({
                    ...filterPagination,
                    where: {
                        enable: true,
                        userId: userId
                    }
                });
            return res.send(onSuccess({
                listDomains: rows,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
}
