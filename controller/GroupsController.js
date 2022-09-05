const { onError, onSuccess } = require("../utils/utils");
const { group, users, position } = require("../models/init-models");
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { Op, where, fn, col, or } = require("sequelize");

module.exports = {
    displayNameIsExisted: async (req, res) => {
        try{
            const {displayName = null} = req.query;
            if(displayName !== null){
                const numberOfDisplayName = await group.count({
                    where:{
                        displayName: displayName.trim(),
                        enable: true
                    }
                });
                if(numberOfDisplayName === 0) return res.send(onSuccess({ isAvailable: true }))
                return res.send(onSuccess({ isAvailable: false }))
            }
        }catch(error){

        }
    },
    // isAvailable: async (req, res) => {
    //     try{
    //         const {groupId = null, displayName = null} = req.query;
    //         if(groupId === null){
    //             const tmp = await group.count({
    //                 where: {
    //                     parentGroupId: null
    //                 }
    //             });
    //             if (tmp !== 0) return res.send(onSuccess({ isAvailable: false }))
    //         }else{
    //             const tmp = await group.findOne({
    //                 where: {
    //                     groupId: groupId
    //                 }
    //             });
    //             if(tmp.enable) return res.send(onSuccess({ isAvailable: true }))
    //             return res.send(onSuccess({ isAvailable: false }))
    //         }
    //     }catch(error){
    //         return res.send(onError(500, error));
    //     }
    // },
    // API thêm mới phòng ban
    addNewGroup: async (req, res) => {
        try {
            const { userId } = req.user;
            const {
                displayName,
                parentGroupId = null,
                description,
                posIds
            } = req.body;

            //Lấy thông tin của user
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                // Kiểm tra xem có phải admin hay không?
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    if (displayName) {
                        //Kiểm tra xem tên phòng/ban đã tồn tại hay chưa?
                        const groupInfo = await group.findOne({
                            where: {
                                displayName: displayName.trim(),
                                enable: true,
                            }
                        });
                        if (groupInfo !== null) {
                            return res.send(onError(405, `Tên phòng ban đã tồn tại`));
                        };

                        // if (parentGroupId === null) {
                        //     // Kiểm tra xem parentGroupId có tồn tại hay không?
                        //     const numberOfParentGroupId = await group.count({
                        //         where: {
                        //             parentGroupId: null,
                        //             enable: true
                        //         }
                        //     });
                        //     // console.log("numberOfParentGroupId > ", numberOfParentGroupId);
                        //     if (numberOfParentGroupId !== 0) {
                        //         // await logAction(ACTION_TYPE.ADD, {
                        //         //     ownerId: userId,
                        //         //     description: `parentGroupId không hợp lệ`,
                        //         // });
                        //         return res.send(onError(409, `parentGroupId không hợp lệ`));
                        //     }

                        // }
                        //Kiểm tra xem parentGroupId có tồn tại hay không?
                        if(parentGroupId !== null){
                            const numberOfGroupId = await group.count({
                                where: {
                                    groupId: parentGroupId,
                                    enable: true,
                                }
                            });
                            if (numberOfGroupId === 0) {
                                return res.send(onError(404, `Định danh không tồn tại.`));
                            }
                        }
                        posIds.forEach(async (e) => {
                            const numberOfPos = await position.count({
                                where: {
                                    posId: e,
                                    enable: true
                                }
                            });
                            if (numberOfPos === 0) {
                                return res.send(onError(404, `Định danh không tồn tại.`));
                            }
                        })
                        const newGroup = await group.create({
                            displayName: displayName.trim(),
                            description: description,
                            posIds: posIds,
                            parentGroupId: parentGroupId
                        });
                        return res.send(onSuccess({ groupId: newGroup.groupId }))
                    }
                } else {
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API chỉnh sửa thông tin phòng/ban
    editGroup: async (req, res) => {
        try {
            const { userId } = req.user;
            const { groupId } = req.params;
            const {
                displayName,
                description,
                parentGroupId = null,
                posIds,
                enable
            } = req.body;
            console.log("posIds: ", posIds)
            // Lấy thông tin của user từ userId
            const userInfo = await users.findOne({
                where: { userId: userId }
            });
            if (userInfo && userInfo.enable) {
                if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                    //Kiểm tra xem groupId có tồn tại hay không?
                    const groupInfo = await group.findOne({
                        where: { 
                            groupId: groupId,
                            enable: true,
                        }
                    });

                    if (groupInfo !== null) {
                        //Kiểm tra xem displayName đã tồn tại hay chưa?
                        if (displayName !== groupInfo.displayName && displayName) {
                            const numberOfDisplayName = await group.count({
                                where: {
                                    displayName: displayName.trim(),
                                    enable: true
                                }
                            });
                            //Nếu displayName chưa tồn tại
                            if (numberOfDisplayName === 0) {
                                groupInfo.displayName = displayName.trim()
                            } else {
                                return res.send(onError(405, "Tên đơn vị đã tồn tại", {}))
                            }
                        }
                        if (groupInfo.parentGroupId !== parentGroupId) {
                            if(parentGroupId !== null) {
                                const numberOfGroupId = await group.count({
                                    where: {
                                        groupId: parentGroupId,
                                        enable: true,
                                    }
                                });
                                if (numberOfGroupId === 0) {
                                    return res.send(onError(404, `Định danh đơn vị cấp trên không tồn tại.`));
                                }
                            }   
                            await group.update({
                                parentGroupId: null,
                            },{
                                where: {
                                    parentGroupId: groupId
                                }
                            });
                            groupInfo.parentGroupId = parentGroupId;
                            
                        }
                        if (enable === false) {
                            await users.update({
                                managementBy: null,
                                posId: null,
                            },{
                                where: {
                                    groupId: groupInfo.groupId
                                }
                            });
                        
                            //Giải phóng các nhân viên thuộc đơn vị hiện tại
                            await users.update({
                                groupId: null,
                            }, {
                                where: {
                                    groupId: groupId
                                }
                            });
                            //Giải phóng các đơn vị con của đơn vị hiện taị
                            await group.update({
                                parentGroupId: null
                            },{
                                where: {
                                    parentGroupId: groupId,
                                }
                            });
                            
                            groupInfo.managementBy = null;
                            groupInfo.enable = false;
                        };
                        if (description !== undefined && groupInfo.description !== description) {
                            groupInfo.description = description;
                        };

                        if (posIds !== undefined && groupInfo.posIds !== posIds) {
                            const common = groupInfo.posIds !== null ? groupInfo.posIds.filter(x => !posIds.includes(x)) : posIds;
                            await users.update({
                                posId: null,
                            }, {
                                where: {
                                    groupId: groupId,
                                    posId: {
                                        [Op.in]: common
                                    }
                                }
                            });
                            groupInfo.posIds = posIds;
                        };
                        const groupUpdate = await groupInfo.save();
                        return res.send(onSuccess({ groupId: groupUpdate.posId }))
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
    // API lấy danh sách phòng ban
    getListGroups: async (req, res) => {
        try {
            const pagination = req.pagination;
            const {
                groupId,
                enable = true,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
            } = req.query;
            let filter = {
                enable: true
            }
            const filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit
            };
            if (groupId) {
                filter = {
                    ...filter,
                    groupId: groupId
                }
            }
            var { count, rows } = await group.findAndCountAll({
                ...filterPagination,
                where: filter,
                order: [["groupId", "DESC"]],
                include: [
                    {
                        model: group,
                        as: "parentGroup"
                    }
                ]
            });
            const result = await Promise.all(rows.map(async (e) => {
                let ids = []
                for (let item in e.posIds) ids.push(e.posIds[item]);
                const positions = await position.findAll({
                    where: {
                        posId: {
                            [Op.in]: ids
                        },
                    },
                    attributes: { include: ['posId', 'displayName'] }
                });
                return {
                    groupId: e.groupId,
                    displayName: e.displayName,
                    enable: e.enable,
                    description: e.description,
                    parentGroupId: e.parentGroupId,
                    parentGroupName: e.parentGroup?.displayName,
                    positions: positions
                }
            }))
            // await logAction(ACTION_TYPE.GET, {
            //     ownerId: userId,
            //     description: 'Lấy danh sách phòng/ban thành công'
            // });
            return res.send(onSuccess({
                listGroups: result,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API lấy danh sách positions theo groupId
    getListPositions: async (req, res) => {
        try {
            const { groupId } = req.params;
            if (groupId !== "initial") {
                const groupInfo = await group.findOne({
                    where: { groupId: groupId }
                });
                if (groupInfo) {
                    let ids = [];
                    for (let item in groupInfo.posIds) ids.push(groupInfo.posIds[item]);
                    const positions = await position.findAll({
                        where: {
                            posId: {
                                [Op.in]: ids
                            },
                            enable: true
                        },
                        attributes: { include: ['posId', 'displayName'] }
                    });
                    return res.send(onSuccess(positions));
                }
            } else {
                return res.send(onSuccess([]));
            }
        } catch (error) {
            return res.send(onError(500, error))
        }
    },
    // API lấy danh sách các phòng ban
    getAllGroups: async (req, res) => {
        try {
            // const { roleId } = req.user;
            const result = await group.findAll({
                where: {
                    enable: true, 
                },
            });
            return res.send(onSuccess(result));
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    getParentGroup: async (req, res) => {
        try {
            const result = await group.findAll({
                where: {
                    enable: true, 
                    parentGroupId: null,
                },
                attributes: ["groupId", "displayName"]
            });
            return res.send(onSuccess(result));
        } catch (error) {
            return res.send(onError(500, error));
        }
    }
}