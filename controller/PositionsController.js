const { onError, onSuccess } = require("../utils/utils");
const { position, users, rolePosition, group } = require("../models/init-models");
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");

module.exports = {
    displayNameIsExisted: async (req, res) => {
        try {
            const { displayName = null } = req.query;
            if (displayName !== null) {
                const numberOfDisplayName = await position.count({
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
    //API thêm mới chức danh
    addNewPos: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                displayName,
                crossGroup = false,
                rolePosId,
                limit,
            } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                //Kiểm tra xem có phải Admin hay không?
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    if (displayName) {
                        //Kiểm tra xem tên chức danh đã tồn tại hay chưa?
                        const positionInfo = await position.findOne({
                            where: {
                                displayName: displayName.trim(),
                                enable: true
                            }
                        });
                        if (positionInfo !== null) {
                            return res.send(onError(405, 'Tên chức danh đã tồn tại'))
                        }
                        const newPosition = await position.create({
                            displayName: displayName.trim(),
                            rolePosId: rolePosId !== undefined ? rolePosId : 2,
                            crossGroup: crossGroup,
                            limit: limit
                        });
                        if (crossGroup) {
                            let listGroups = await group.findAll({
                                where: {
                                    enable: true
                                }
                            });
                            for (let index = 0; index < listGroups.length; index++) {
                                let currentPosIds = listGroups[index].posIds;
                                await group.update({
                                    posIds: [...currentPosIds, newPosition.posId]
                                }, {
                                    where: {
                                        groupId: listGroups[index].groupId
                                    }
                                })
                            }
                        }
                        return res.send(onSuccess({
                            positionId: newPosition.posId
                        }))
                    }
                } else {
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        } catch (error) {
            // console.log(error);
            return res.send(onError(500, error));
        }
    },
    //API chỉnh sửa thông tin chức danh
    editPos: async (req, res) => {
        try {
            const { userId } = req.user;
            const { posId } = req.params;
            const {
                displayName,
                limit,
                crossGroup,
                rolePosId,
                enable
            } = req.body;

            //Lấy thông tin của user từ userId
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    //Kiểm tra xem posId có tồn tại hay không?
                    const positionInfo = await position.findOne({
                        where: {
                            posId: posId,
                            enable: true,
                        }
                    });

                    if (positionInfo !== null) {
                        //Kiểm tra xem displayName đã tồn tại hay chưa?
                        if (displayName !== positionInfo.displayName && displayName) {
                            const numberOfDisplayName = await position.count({
                                where: {
                                    displayName: displayName.trim(),
                                    enable: true,
                                }
                            });
                            //Nếu displayName chưa tồn tại
                            if (numberOfDisplayName === 0) {
                                positionInfo.displayName = displayName.trim()
                            } else {
                                return res.send(onError(405, "Tên chức danh đã tồn tại", {}))
                            }
                        }

                        if (enable === false) {
                            await users.update({
                                posId: null,
                            }, {
                                where: {
                                    posId: posId
                                }
                            });
                            positionInfo.enable = enable;
                        };
                        if (limit !== undefined && positionInfo.limit !== parseInt(limit)) {
                            positionInfo.limit = parseInt(limit);
                        }
                        if (crossGroup !== undefined && positionInfo.crossGroup !== crossGroup) {
                            positionInfo.crossGroup = crossGroup;
                        }
                        if (rolePosId !== undefined && positionInfo.rolePosId !== parseInt(rolePosId)) {
                            positionInfo.rolePosId = parseInt(rolePosId);
                        }
                        const positionUpdate = await positionInfo.save();
                        return res.send(onSuccess({ posId: positionUpdate.posId }))
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
    getListPos: async (req, res) => {
        try {
            const { userId } = req.user;
            const pagination = req.pagination;
            const {
                posId,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
            } = req.query;
            let filter = {
                enable: true
            }
            const filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["posId", "DESC"]],
            };
            if (posId) {
                filter = {
                    ...filter,
                    posId: posId
                }
            }
            var { count, rows } = await position.findAndCountAll({
                ...filterPagination,
                where: filter,
                include: [
                    {
                        model: rolePosition,
                        as: "rolePo"
                    }
                ]
            });
            const result = rows.map((e) => {
                return {
                    posId: e.posId,
                    displayName: e.displayName,
                    limit: e.limit,
                    enable: e.enable,
                    rolePosId: e.rolePo?.rolePosId,
                    roleName: e.rolePo?.displayName,
                    crossGroup: e.crossGroup
                }
            })
            return res.send(onSuccess({
                listPos: result,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        } catch (error) {
            return res.send(onError(500, error))
        }
    },
    getAllRole: async (req, res) => {
        try {
            const result = await rolePosition.findAll({
                where: {
                    enable: true,
                },
                order: [["rolePosId", "ASC"]]
            })
            return res.send(onSuccess(result));
        } catch (erorr) {

        }
    },
    // API lấy danh sách các vị trí của phòng ban
    getAllPos: async (req, res) => {
        try {
            const result = await position.findAll({
                where: {
                    enable: true,
                },
                order: [["rolePosId", "ASC"]]
            });
            return res.send(onSuccess(result));
        } catch (error) {
            return res.send(onError(500, error));
        }
    }
}