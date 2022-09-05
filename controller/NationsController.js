const { onError, onSuccess } = require("../utils/utils");
const { nation, area, users, events } = require("../models/init-models");
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { Op, where, fn, col } = require("sequelize");

module.exports = {
    getAllNations: async (req, res) => {
        try {
            const allNations = await nation.findAll({
                where: {
                    enable: true
                }
            });
            return res.send(onSuccess({ nations: allNations }))
        } catch (error) {
            // console.log(error)
        }
    },
    displayNameIsExisted: async (req, res) => {
        try {
            const { displayName = null } = req.query;
            if (displayName !== null) {
                const numberOfDisplayName = await nation.count({
                    where: {
                        displayName: displayName.trim(),
                        enable: true
                    }
                });
                if (numberOfDisplayName === 0) return res.send(onSuccess({ isAvailable: true }))
                return res.send(onSuccess({ isAvailable: false }))
            }
        } catch (error) {

        }
    },
    //API Thêm mới quốc gia
    addNewNation: async (req, res) => {
        try {
            const { userId } = req.user;
            const { displayName, areaId } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                //Kiểm tra xem có phải admin hay không?
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    if (displayName) {
                        //kiểm tra xem tên quốc gia đã tồn tại hay chưa?
                        const nationInfo = await nation.findOne({
                            where: {
                                displayName: displayName.trim(),
                                enable: true,
                            }
                        });
                        if (nationInfo !== null) {
                            return res.send(onError(405, `Tên quốc gia đã tồn tại`));
                        }
                        //Kiểm tra areaId có tồn tại hay không?
                        const numberOfArea = await area.count({
                            where: {
                                areaId: areaId,
                                enable: true
                            }
                        })
                        if (numberOfArea === 0) {
                            return res.send(onError(404, `Khu vực có areaId ${areaId} không tồn tại`));
                        }
                        const newNation = await nation.create({
                            displayName: displayName.trim(),
                            areaId: areaId,
                            enable: true
                        });
                        return res.send(onSuccess({ nationId: newNation.nationId }));
                    } else {
                        return res.send(onError(402, "Tên quốc gia không hợp lệ"));
                    }
                } else {
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    //API chỉnh sửa thông tin quốc gia
    editNation: async (req, res) => {
        try {
            const { userId } = req.user;
            const { nationId } = req.params;
            const { displayName, enable, areaId } = req.body;
            //Lấy thông tin của user từ userId
            const userInfo = await users.findOne({
                where: { userId: userId }
            });

            if (userInfo && userInfo.enable) {
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    //Kiểm tra xem nationId có tồn tại hay không?
                    const nationInfo = await nation.findOne({
                        where: {
                            nationId: nationId,
                            enable: true,
                        }
                    });
                    if (nationInfo !== null) {
                        if (areaId && areaId !== nationInfo.areaId) {
                            const numberOfArea = await area.count({
                                where: {
                                    areaId: areaId,
                                    enable: true,
                                }
                            })
                            if (numberOfArea !== 0) {
                                nationInfo.areaId = areaId
                            } else {
                                return res.send(onError(404, "Khu vực không tồn tại", {}))
                            }
                        }
                        //Kiểm tra xem displayName đã tồn tại hay chưa?
                        if (displayName && nationInfo.displayName !== displayName) {
                            const numberOfDisplayName = await nation.count({
                                where: {
                                    displayName: displayName.trim(),
                                    enable: true
                                }
                            });
                            //Nếu displayName chưa tồn tại
                            if (numberOfDisplayName === 0) {
                                nationInfo.displayName = displayName.trim();
                            } else {
                                return res.send(onError(405, "Tên quốc gia đã tồn tại", {}))
                            }
                        }
                        if (enable === false) {
                            await events.update({
                                nationId: null,
                            }, {
                                where: {
                                    nationId: nationId,
                                }
                            });
                            nationInfo.enable = enable;
                        }
                        const nationUpdate = await nationInfo.save();
                        return res.send(onSuccess({ nationId: nationUpdate.nationId }))
                    } else {
                        return res.send(onError(404, "Định danh không tồn tại", {}))
                    }
                } else {
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        } catch (error) {
            return res.send(onError(500, error))
        }
    },
    //API lấy danh sách quốc gia
    getListNations: async (req, res) => {
        try {
            const { userId } = req.user;
            const pagination = req.pagination;
            const {
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
                keyword,
            } = req.query;

            let textSearch = keyword ? req.query.keyword.trim() : "";

            const filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["nationId", "DESC"]],
            };
            if (textSearch !== "") {
                var { count, rows } = await nation.findAndCountAll({
                    ...filterPagination,
                    where: {
                        enable: true,
                        displayName: where(
                            fn("LOWER", col("nation.displayName")),
                            "LIKE",
                            "%" + textSearch.toLowerCase() + "%"
                        )
                    },
                    include: [
                        {
                            model: area,
                            as: "area"
                        }
                    ]
                });
            } else {
                var { count, rows } = await nation.findAndCountAll({
                    ...filterPagination,
                    where: {
                        enable: true,
                    },
                    include: [
                        {
                            model: area,
                            as: "area"
                        }
                    ]
                })
            }
            const results = rows.map((e) => {
                return {
                    nationId: e.nationId,
                    displayName: e.displayName,
                    enable: e.enable,
                    areaId: e.area?.areaId,
                    areaName: e.area?.displayName,
                }
            })
            return res.send(onSuccess({
                listNations: results,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        } catch (error) {
            return res.send(onError(500, error))
        }
    }
}