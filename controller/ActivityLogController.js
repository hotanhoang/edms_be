const { onError, onSuccess } = require("../utils/utils");
const { group, users, position, action, activityLogs } = require("../models/init-models");
const { ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { Op, where } = require("sequelize");
const moment = require("moment")


module.exports = {
    getListAction: async (req, res) => {
        try {
            const { userId } = req.user;
            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model: position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            var listAction;
            if (currentUser.roleId === 0) {
                listAction = await action.findAll({
                    where: {
                        actionId: {
                            [Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 9]
                        }
                    },
                    order: [["actionId", "ASC"]],
                    attributes: ["actionId", "displayName"]
                });
            } else {
                listAction = await action.findAll({
                    order: [["actionId", "ASC"]],
                    attributes: ["actionId", "displayName"]
                });
            }

            listAction.push({
                actionId: null,
                displayName: "Tất cả hành động",
            })
            return res.send(onSuccess({
                listAction: listAction
            }));
        } catch (error) {
            // console.log("error > ", error);
        }
    },
    getListUsers: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                inGroupId = null,
            } = req.query;
            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model: position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            var listUsers;
            if (inGroupId == null) {
                if (currentUser.po.rolePosId === 1) {
                    listUsers = await users.findAll({
                        where: {
                            [Op.or]: [
                                {
                                    groupId: currentUser.groupId
                                },
                                {
                                    '$group_group.parentGroupId$': currentUser.groupId,
                                }
                            ]

                        },
                        include: [{
                            model: group,
                            as: "group_group",
                        }],
                        attributes: ["userId", "displayName", "avatar", "groupId"]
                    });
                } else if (currentUser.roleId === 0) {
                    listUsers = await users.findAll({
                        attributes: ["userId", "displayName", "avatar", "groupId"]
                    });
                }
                else {
                    //Lấy danh sách đơn vị được quản lý bởi currentUserId
                    const listGroupManaged = await group.findAll({
                        where: {
                            managementBy: currentUser.userId
                        },
                        attributes: ["groupId"]
                    });
                    let listGroupIdManaged = [];
                    for (let index = 0; index < listGroupManaged.length; index++) {
                        listGroupIdManaged.push(listGroupManaged[index].groupId)
                    }
                    listUsers = await users.findAll({
                        where: {
                            [Op.or]: [{
                                managementBy: currentUser.userId
                            }, {
                                groupId: {
                                    [Op.in]: listGroupIdManaged
                                }
                            }]
                        },
                        attributes: ["userId", "displayName", "avatar", "groupId"]
                    });
                }
            } else {
                listUsers = await users.findAll({
                    where: {
                        groupId: inGroupId
                    },
                    attributes: ["userId", "displayName", "avatar", "groupId"]
                });
            }

            if (listUsers.length !== 0)
                listUsers.push({
                    userId: "none",
                    displayName: "Tất cả người dùng",
                    avatar: null,
                    groupId: null
                })
            return res.send(onSuccess({
                listUsers: listUsers
            }));
        } catch (error) {
            // console.log("error > ", error);
        }
    },
    getListGroups: async (req, res) => {
        try {
            const { userId } = req.user;
            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model: position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            var listGroups = [];
            if (currentUser.posId === 1) {
                listGroups = await group.findAll({
                    where: {
                        [Op.or]: [{
                            parentGroupId: currentUser.groupId
                        },
                        {
                            groupId: currentUser.groupId
                        }]
                    },
                    attributes: ["groupId", "displayName"]
                });
            } else if (currentUser.roleId === 0) {
                listGroups = await group.findAll({
                    attributes: ["groupId", "displayName"]
                });
            }
            else {
                listGroups = await group.findAll({
                    where: {
                        managementBy: currentUser.userId
                    },
                    attributes: ["groupId", "displayName"]
                })
            }
            if (listGroups.length !== 0)
                listGroups.push({
                    groupId: null,
                    displayName: "Tất cả đơn vị",
                })
            return res.send(onSuccess({
                listGroups: listGroups
            }));
        } catch (error) {
            // console.log("error > ", error);
        }
    },
    getListLog: async (req, res) => {
        try {
            const { userId } = req.user;
            const pagination = req.pagination;
            const {
                inUserId = null,
                inActionId = null,
                inGroupId = null,
                startTime = null,
                endTime = null,
            } = req.query;
            const { pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index, } = req.query;

            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model: position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            var listUserId = [currentUser.userId];
            const filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["createdDate", "DESC"]],
            };
            var visible = [true];
            var listAction = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            var filter = {}
            if (currentUser.roleId !== 0) {
                if (currentUser.po.rolePosId === 2) {//La cap pho
                    //Lấy danh sách đơn vị được quản lý bởi currentUserId
                    const listGroupManaged = await group.findAll({
                        where: {
                            managementBy: currentUser.userId
                        },
                        attributes: ["groupId"]
                    });
                    let listGroupIdManaged = [];
                    for (let index = 0; index < listGroupManaged.length; index++) {
                        listGroupIdManaged.push(listGroupManaged[index].groupId)
                    }
                    //Lấy danh sách người dùng được quản lý bởi currentUserId hoặc thuộc đơn vị được quản lí bởi currentUserId
                    const listUsersManaged = await users.findAll({
                        where: {
                            [Op.or]: [{
                                managementBy: currentUser.userId
                            }, {
                                groupId: {
                                    [Op.in]: listGroupIdManaged
                                }
                            }],
                            userId: {
                                [Op.ne]: currentUser.userId
                            }
                        },
                        attributes: ["userId"]
                    });
                    listUsersManaged.forEach((e) => listUserId.push(e.userId));
                }
                else if (currentUser.po.rolePosId === 1) {//La cap truong
                    const parentGroupInfo = await group.findOne({
                        where: {
                            groupId: currentUser.groupId
                        }
                    });
                    if (parentGroupInfo.parentGroupId === null) {//La cuc truong
                        // listUserId = [currentUser.userId];
                        const groups = await group.findAll({
                            where: {
                                parentGroupId: parentGroupInfo.groupId
                            }
                        });
                        await Promise.all(
                            groups.map(async (e) => {
                                const rows = await users.findAll({
                                    where: {
                                        groupId: e.groupId,
                                        userId: {
                                            [Op.ne]: currentUser.userId
                                        }
                                    },
                                    attributes: ["userId"]
                                });
                                for (let index = 0; index < rows.length; index++) {
                                    listUserId.push(rows[index].userId)
                                }
                            })
                        )
                    } else {
                        // listUserId = [currentUser.userId];
                        const rows = await users.findAll({
                            where: {
                                groupId: currentUser.groupId,
                                userId: {
                                    [Op.ne]: currentUser.userId
                                }
                            },
                            attributes: ["userId"]
                        });
                        for (let index = 0; index < rows.length; index++) {
                            listUserId.push(rows[index].userId)
                        }
                    }

                }
                // else if(currentUser.po.rolePosId === 3) listUserId = [currentUser.userId]
                if (inActionId !== null) {
                    visible.push(false)
                    filter = {
                        ...filter,
                        actionId: inActionId
                    }
                }
            } else {
                filter = {
                    ...filter,
                    actionId: {
                        [Op.in]: listAction
                    }
                }
                const allUsers = await users.findAll({
                    attributes: ["userId"]
                });
                allUsers.forEach((e) => listUserId.push(e.userId));
                if (inActionId !== null && inActionId > 0 && inActionId < 10) {
                    visible.push(false)
                    filter = {
                        ...filter,
                        actionId: inActionId
                    }
                }
            }
            if (inGroupId !== null) {
                listUserId = [];
                const listUsersInGroup = await users.findAll({
                    where: {
                        groupId: inGroupId
                    },
                    attributes: ["userId"]
                });
                for (let index = 0; index < listUsersInGroup.length; index++) {
                    listUserId.push(listUsersInGroup[index].userId)
                }
            }
            if (inUserId !== null) {
                const user = await users.findOne({
                    where: {
                        userId: inUserId
                    },
                    attributes: ["groupId"]
                });
                if (inGroupId !== null && parseInt(inGroupId) !== user.groupId) {
                    const groupInfo = await group.findOne({
                        where: {
                            groupId: inGroupId
                        },
                        attributes: ["displayName"]
                    })
                    return res.send(onError(403, `Tài khoản ${user.displayName} không tồn tại trong đơn vị ${groupInfo.displayName}`));
                }


                listUserId = [inUserId]
            }
            if (startTime !== null && endTime !== null) {
                filter = {
                    ...filter,
                    createdDate: {
                        [Op.and]: {
                            [Op.gte]: moment(startTime, 'YYYY-MM-DD').startOf('day'),
                            [Op.lte]: moment(endTime, 'YYYY-MM-DD').endOf('day')
                        }
                    }
                };
            }
            filter = {
                ...filter,
                ownerId: {
                    [Op.in]: listUserId
                }
            };
            // console.log("listUserId > ", listUserId)
            const { count, rows } = await activityLogs.findAndCountAll({
                where: { ...filter },
                ...filterPagination,
                include: [
                    {
                        model: users,
                        as: "owner",
                        // Chỉ lấy các thuộc tính
                        attributes: ["displayName", "avatar"],
                    },
                    {
                        model: action,
                        as: "action",
                        where: {
                            visible: {
                                [Op.in]: visible
                            }
                        },
                        attributes: ["displayName"]
                    }
                ]
            });
            return res.send(onSuccess({
                listLogs: rows,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        } catch (error) {
            // console.log("error > ", error);
        }
    }
}