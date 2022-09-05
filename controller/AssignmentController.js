const { onError, onSuccess, onDataManagementPersonFormat } = require("../utils/utils");
const { area, users, group, position, rolePosition } = require("../models/init-models");
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { Op, where, fn, col } = require("sequelize");
const _ = require('lodash');
module.exports = {
    getListUsers: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                rolePosId,
                enable = true,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
                keyword,
            } = req.query;
            const pagination = req.pagination;
            let textSearch = keyword ? req.query.keyword.trim() : '';

            //Lấy thông tin của user
            const userInfo = await users.findOne({
                where: { userId: userId },
                attributes: ["userId", "groupId", "posId", "enable"],
                include: [{
                    model: position,
                    as: "po",
                }]
            });
            const rolePosIdOfUser = userInfo.po.rolePosId;
            const parentGroupOfUserGroup = await group.findOne({
                where: {
                    groupId: userInfo.groupId
                }
            });
            const parentGroupIdOfUserGroup = parentGroupOfUserGroup.parentGroupId;
            if (userInfo && userInfo.enable) {
                const curGroupId = userInfo.groupId;
                if (curGroupId !== null) {
                    const curRolePosId = userInfo?.po?.rolePosId;
                    var filter = {
                        groupId: curGroupId,
                        enable: enable,
                    };
                    if (curRolePosId === 3) {
                        return res.send(
                            onError(401, "Tài khoản không có quyền")
                        );
                    };
                    if (rolePosId) {
                        if (textSearch !== "") {
                            filter = {
                                ...filter,
                                displayName: where(
                                    fn("LOWER", col("users.displayName")),
                                    "LIKE",
                                    "%" + textSearch.toLowerCase() + "%"
                                )
                            }
                        }
                        if (curRolePosId === 2 && parseInt(rolePosId) !== 3) {
                            filter = {
                                ...filter,
                                userId: userId
                            }
                        }
                        const { count, rows } = await users.findAndCountAll({
                            where: filter,
                            offset: pagination.offset,
                            limit: pagination.limit,
                            include: [
                                {
                                    model: position,
                                    as: "po",
                                    where: {
                                        rolePosId: rolePosId,
                                    }
                                },
                            ]
                        });
                        const result = await Promise.all(
                            rows.map(async (e) => {
                                // if(userInfo.po.posId === 2 || userInfo.po.posId === 1){
                                if ((parseInt(rolePosIdOfUser) === 1 || parseInt(rolePosIdOfUser) === 2) && parentGroupIdOfUserGroup === null) {//Thuoc cap cuc
                                    let groups = [];
                                    let groupIds = [];
                                    const listGroupManaged = await group.findAll({
                                        where: {
                                            managementBy: e.userId,
                                            enable: true
                                        },
                                        attributes: ["displayName", "groupId"]
                                    });
                                    for (let index = 0; index < listGroupManaged.length; index++) {
                                        groups.push(listGroupManaged[index].displayName)
                                        groupIds.push(listGroupManaged[index].groupId);
                                    }
                                    e.listGroupManaged = _.truncate(groups.join(", "), {
                                        'length': 50,
                                        'separator': ' '
                                    });
                                    e.listGroupIdManaged = groupIds;
                                }
                                if ((parseInt(rolePosIdOfUser) === 1 || parseInt(rolePosIdOfUser) === 2) && parentGroupIdOfUserGroup !== null) {
                                    let userIds = [];
                                    const listUserManaged = await users.findAll({
                                        where: {
                                            managementBy: e.userId
                                        },
                                        attributes: ["userId", "avatar", "displayName"]
                                    });
                                    for (let index = 0; index < listUserManaged.length; index++) {
                                        userIds.push(listUserManaged[index].userId);
                                    }
                                    e.listUserManaged = listUserManaged;
                                    e.listUserIdManaged = userIds;
                                }
                                return onDataManagementPersonFormat(e);
                            })
                        )
                        return res.send(onSuccess({
                            listManagementPerson: result,
                            pageSize: parseInt(pageSize),
                            pageIndex: parseInt(pageIndex),
                            count,
                        }))
                    }
                } else {
                    return res.send(onSuccess({
                        listManagementPerson: [],
                        pageSize: parseInt(pageSize),
                        pageIndex: parseInt(pageIndex),
                        count,
                    }))
                }
            }
        } catch (error) {
            // console.log('error > ', error);
        }
    },
    getListChildrentGroup: async (req, res) => {
        try {
            const { userId } = req.user;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });

            if (userInfo && userInfo.enable) {
                //Kiểm tra xem có phải admin hay không?
                if (userInfo.roleId === ROLE_TYPES.USER) {
                    const { count, rows } = await group.findAndCountAll({
                        where:
                        {
                            parentGroupId: userInfo.groupId,
                            enable: true
                        },
                        attributes: ["groupId", "displayName", "managementBy"],
                    })
                    return res.send(onSuccess({
                        listChildrentGroup: rows
                    }))
                } else {
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }

        } catch (error) {
            return res.send(onError(500, error))
        }
    },
    groupsManager: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                userManagerId,
                listGroup,
            } = req.body;
            //Lấy thông tin user
            // console.log("listGroup: ", listGroup)
            const userInfo = await users.findOne({
                where: { userId: userId },
                include: [{
                    model: position,
                    as: "po",
                }]
            });
            if (userInfo && userInfo.enable) {
                const curRolePosId = userInfo.po.rolePosId;
                const curGroupId = userInfo.groupId;
                //Lấy thông tin của userManager
                const userManagerInfo = await users.findOne({
                    where: { userId: userManagerId },
                    include: [{
                        model: position,
                        as: "po"
                    }]
                });
                const maRolePostId = userManagerInfo.po.rolePosId;
                const maGroupId = userManagerInfo.groupId;
                // console.log("maRolePostId: ", maRolePostId)
                // console.log("maGroupId: ", maGroupId)

                if (maGroupId === curGroupId) {
                    if (maRolePostId === 2 && curRolePosId === 1) {
                        var listRmGroup = await group.findAll({
                            where: {
                                groupId: {
                                    [Op.notIn]: listGroup
                                },
                                managementBy: userManagerId,
                                enable: true
                            }
                        });
                        for (let index = 0; index < listRmGroup.length; index++) {
                            if (listRmGroup[index].managementBy !== null) {
                                listRmGroup[index].managementBy = null;
                                await listRmGroup[index].save();
                            }
                        }
                        await Promise.all(
                            listGroup.map(async (e) => {
                                const groupInfo = await group.findOne({
                                    where: {
                                        groupId: e,
                                        enable: true,
                                        parentGroupId: curGroupId
                                    }
                                });
                                if (groupInfo) {
                                    groupInfo.managementBy = userManagerId;
                                    await groupInfo.save();
                                }
                            })
                        )

                        return res.send(onSuccess())
                    } else {
                        return res.send(onError(401, "Tài khoản không có quyền", {}))
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
    usersManager: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                userManagerId,
                listUsers
            } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: { userId: userId },
                include: [{
                    model: position,
                    as: "po",
                }]
            });
            if (userInfo && userInfo.enable) {
                const curRolePosId = userInfo.po.rolePosId;
                const curGroupId = userInfo.groupId;
                //Lấy thông tin của userManager
                const userManagerInfo = await users.findOne({
                    where: { userId: userManagerId },
                    include: [{
                        model: position,
                        as: "po"
                    }]
                })
                const maRolePostId = userManagerInfo.po.rolePosId;
                const maGroupId = userManagerInfo.groupId;

                if (curGroupId === maGroupId) {
                    if (maRolePostId === 2 && curRolePosId === 1) {
                        var listRmUsers = await users.findAll({
                            where: {
                                userId: {
                                    [Op.notIn]: listUsers
                                },
                                managementBy: userManagerId,
                                enable: true,
                            }
                        });
                        for (let index = 0; index < listRmUsers.length; index++) {
                            if (listRmUsers[index].managementBy !== null) {
                                listRmUsers[index].managementBy = null;
                                await listRmUsers[index].save();
                            }
                        }
                        await Promise.all(
                            listUsers.map(async (e) => {
                                const userInfo = await users.findOne({
                                    where: {
                                        userId: e,
                                        enable: true,
                                        groupId: maGroupId
                                    },
                                    include: [{
                                        model: position,
                                        as: "po",
                                        where: {
                                            rolePosId: 3
                                        }
                                    }]
                                });
                                if (userInfo) {
                                    userInfo.managementBy = userManagerId;
                                    await userInfo.save();
                                }
                            })
                        )
                        return res.send(onSuccess())
                    }
                }
            }
        } catch (error) {
            // console.log(error);
            return res.send(onError(500, error));
        }
    },
}