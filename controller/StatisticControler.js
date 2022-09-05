const { onError, onSuccess } = require("../utils/utils");
const { group, users, position, action,documents, activityLogs, multiDocSumResults } = require("../models/init-models");
const { ACTION_TYPE, PAGINATION_CONSTANTS, ROLE_TYPES } = require("../utils/constants");
const { Op, where } = require("sequelize");
const sequelize = require("sequelize");
const { onDataStatisticFormat, _onDataStatisticFormat } = require("../utils/utils");

const moment = require("moment")

module.exports = {
    statistic: async (req, res) => {
        try{
            const { userId } = req.user;
            const {
                type = null,
                startTime = null,
                endTime = null,
            } = req.query;

            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model:  position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            const userGroup = await group.findOne({
                where: {
                    groupId: currentUser.groupId 
                }
            })
            const parentGroupIdOfUserGroup = userGroup.parentGroupId;
            var filter = {}
            var listAction = [1, 11, 30, 41, 20];
            let listGroupIdManaged = []
            //Neu la user
            if(currentUser.roleId !== 0){
                //Neu user la cap cuc
                if(parentGroupIdOfUserGroup === null && currentUser.po.rolePosId !== 3){
                    let groups;
                    //Neu user la cuc truong, lay danh sach tat cac cac phong la cap duoi
                    if(currentUser.po.rolePosId === 1){
                        groups = await group.findAll({
                            where: {
                                [Op.or]: [{
                                    parentGroupId: currentUser.groupId
                                },{
                                    groupId: currentUser.groupId
                                }]
                            }
                        });
                    }else if(currentUser.po.rolePosId === 2){
                        //Neu user la cuc pho, lay danh sach tat ca cac don vi do cuc pho quan ly
                        groups = await group.findAll({
                            where: {
                                managementBy: currentUser.userId
                            },
                            attributes: ["groupId"]
                        });
                    }
                    for(let index = 0; index < groups.length; index++){
                        listGroupIdManaged.push(groups[index].groupId)
                    }
                    console.log("listGroupIdManaged: ", listGroupIdManaged);
                    if(startTime !== null && endTime !== null){
                        filter = {
                            ...filter,
                            createdDate: {
                                [Op.and]: {
                                    [Op.gte]: moment(startTime, 'YYYY-MM-DD').startOf('day'),
                                    [Op.lte]: moment(endTime, 'YYYY-MM-DD').endOf('day')
                                }
                            }
                        };
                        console.log("filter: ", filter);
                    }
                    if(type === "pieChart"){
                        const result = await Promise.all(
                            listAction.map(async (e) => {
                                const rows = await activityLogs.findAll({
                                    where: {...filter, ...{actionId: e}},
                                    attributes: [[sequelize.col('owner->group_group.displayName'), 'type'], [sequelize.fn('count', sequelize.col('owner.groupId')), 'value']],
                                    group : ['owner.groupId','owner->group_group.groupId'],
                                    order: sequelize.literal('value DESC'),
                                    limit: 5,
                                    include: [{
                                        model: users,
                                        where: {
                                            groupId: {
                                                [Op.in]: listGroupIdManaged
                                            }
                                        },
                                        as: "owner",
                                        attributes: [],
                                        include: {
                                            model: group,
                                            as: "group_group",
                                            attributes: ['displayName']
                                        }
                                    }]
                                });
                                return {[e]: rows}
                            })
                        )
        
                        return res.send(onSuccess({
                            result: result,
                        }))
                    }else if(type === "columnChart"){
                        const result = await Promise.all(
                            listGroupIdManaged.map(async (e) => {
                                const rows = await activityLogs.findAll({
                                    where: {...filter, ...{actionId: {[Op.in]: listAction}}},
                                    attributes: [[sequelize.col('owner->group_group.displayName'), 'displayName'],[sequelize.col('action.displayName'), 'actionName'], [sequelize.fn('count', sequelize.col('action.actionId')), 'value']],
                                    group : ['action.actionId','owner.groupId',"owner->group_group.groupId"],
                                    include: [{
                                        model: action,
                                        as: "action",
                                        attributes: []
                                    },{
                                        model: users,
                                        where: {
                                            groupId: e
                                        },
                                        as: "owner",
                                        attributes: [],
                                        include: {
                                            model: group,
                                            as: "group_group",
                                            attributes: ['displayName']
                                        }
                                    }]
                                });
                                return rows;
                            })
                        )
                        return res.send(onSuccess({
                            result: result,
                        }))
                    }
                }else{
                    var listUserId = [currentUser.userId];
                    if(currentUser.po.rolePosId === 2){
                        //Neu user là pho phong
                        //Lấy danh sách người dùng được quản lí bởi currentUserId
                        const listUsersManaged = await users.findAll({
                            where: {
                                [Op.or]: [{
                                    managementBy: currentUser.userId
                                },{
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
                    }else if(currentUser.po.rolePosId === 1){
                        //Neu la truong phong
                        //Lay danh sach nguoi dung la thuoc don vi
                        const rows = await users.findAll({
                            where: {
                                groupId: currentUser.groupId,
                                userId: {
                                    [Op.ne]: currentUser.userId
                                }
                            },
                            attributes: ["userId"]
                        });
                        for(let index = 0; index < rows.length; index++){
                            listUserId.push(rows[index].userId)
                        }
                    }
                    if(startTime !== null && endTime !== null){
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
                    if(type === "pieChart"){
                        const result = await Promise.all(
                            listAction.map(async (e) => {
                                const rows = await activityLogs.findAll({
                                    where: {
                                        ...filter,...{actionId: e}
                                    },
                                    attributes: [[sequelize.col('owner.displayName'), 'type'], [sequelize.fn('count', sequelize.col('activityLogs.ownerId')), 'value']],
                                    group : ['activityLogs.ownerId', 'owner.userId'],
                                    order: sequelize.literal('value DESC'),
                                    limit: 5,
                                    include: [{
                                        model: users,
                                        as: "owner",
                                        attributes: []
                                    }]
                                });
                                return {[e]: rows}
                            })
                        )
        
                        return res.send(onSuccess({
                            result: result,
                        }))
                        
                    }else if(type === "columnChart"){
                        const result = await Promise.all(
                            listUserId.map(async (e) => {
                                const rows = await activityLogs.findAll({
                                    where: {...filter, ...{ownerId: e, actionId: {[Op.in]: listAction}}},
                                    attributes: [[sequelize.col('action.displayName'), 'actionName'],[sequelize.col('owner.displayName'), 'displayName'], [sequelize.fn('count', sequelize.col('activityLogs.actionId')), 'value']],
                                    group : ['activityLogs.actionId','action.actionId','activityLogs.ownerId', 'owner.userId'],
                                    include: [{
                                        model: action,
                                        as: "action",
                                        attributes: []
                                    },{
                                        model: users,
                                        as: "owner",
                                        attributes: []
                                    }]
                                });
                                return rows;
                            })
                        )
                        return res.send(onSuccess({
                            result: result,
                        }))
                    }
                    const result = await Promise.all(
                        listAction.map(async (e) => {
                            let day = 31;
                            var dataDate = []
                            while(day > 0){
                                var {count, rows} = await activityLogs.findAndCountAll({
                                    where: {
                                        ...filter,
                                        ...{
                                            actionId: e, 
                                            ownerId: listUserId[0],
                                            createdDate: {
                                                [Op.gte]: moment().subtract(day, 'day').toDate(),
                                                [Op.lt]: moment().subtract(day-1, 'day').toDate(),
                                            }
                                        }
                                    },
                                    attributes: ['createdDate']
                                });
                                dataDate.push({
                                    date: moment().subtract(day-1, 'day').format("DD/MM/YYYY"),
                                    value: count
                                });
                                day--;
                            }
                            
                            return {[e]: dataDate}
                        })
                    )
                    return res.send(onSuccess({
                        result: result,
                    }))

                }
            }

        }catch(error){
            console.log("error: ", error)
        }
    },
    statistic_admin: async (req, res) => { 
        try{
            const { userId } = req.user;
            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model:  position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            if(currentUser.roleId === ROLE_TYPES.ADMIN){
                //Tong so nguoi dung
                const totalUsers = await users.count();
                const totalCapacity = await users.sum('capacity');
                const totalUsageStorage = await users.sum('usageStorage');
                const totalDocSumResults = await multiDocSumResults.count();

                let day = 31;
                let userByDate = [];
                let docUploadByDate = [];
                let usageByDate = [];
                let docSumByDate = [];
                while(day > 0){
                    var {count, rows} = await users.findAndCountAll({
                        where: {
                            lastAccess: {
                                [Op.gte]: moment().subtract(day, 'day').toDate(),
                                [Op.lt]: moment().subtract(day-1, 'day').toDate(),
                            }
                        },
                        attributes: ['lastAccess']
                    });
                    userByDate.push({
                        date: moment().subtract(day-1, 'day').format("DD/MM/YYYY"),
                        value: count
                    });
                    var {count, rows} = await documents.findAndCountAll({
                        where: {
                            createdDate: {
                                [Op.gte]: moment().subtract(day, 'day').toDate(),
                                [Op.lt]: moment().subtract(day-1, 'day').toDate(),
                            }
                        },
                        attributes: ['createdDate']
                    });
                    docUploadByDate.push({
                        date: moment().subtract(day-1, 'day').format("DD/MM/YYYY"),
                        value: count
                    });
                    var rows = await documents.findAll({
                        where: {
                            createdDate: {
                                [Op.gte]: moment().subtract(day, 'day').toDate(),
                                [Op.lt]: moment().subtract(day-1, 'day').toDate(),
                            }
                        },
                        attributes: ['createdDate',"sizeOfFileOnDisk"]
                    });
                    var totalUsageByDate = 0;
                    rows.forEach((e) => {
                        totalUsageByDate = totalUsageByDate + e.sizeOfFileOnDisk
                    })
                    usageByDate.push({
                        date: moment().subtract(day-1, 'day').format("DD/MM/YYYY"),
                        value: (totalUsageByDate / 1000000).toFixed(3)
                    });
                    var {count, rows} = await multiDocSumResults.findAndCountAll({
                        where: {
                            createdDate: {
                                [Op.gte]: moment().subtract(day, 'day').toDate(),
                                [Op.lt]: moment().subtract(day-1, 'day').toDate(),
                            }
                        },
                        attributes: ['createdDate']
                    });
                    docSumByDate.push({
                        date: moment().subtract(day-1, 'day').format("DD/MM/YYYY"),
                        value: count
                    });
                    day--;
                }
                const dataByDate = {
                    'userByDate': userByDate,
                    'docUploadByDate': docUploadByDate,
                    'usageByDate': usageByDate,
                    'docSumByDate': docSumByDate
                }
                return res.send(onSuccess({
                    totalUsers: totalUsers,
                    totalCapacity:totalCapacity,
                    totalDocSumResults:totalDocSumResults,
                    totalUsageStorage: totalUsageStorage,
                    dataChart: dataByDate,

                }))

            }
        }catch(error){
            console.log("error: ", error)
        }
    },
    statistic_all: async (req, res) => {
        try{
            const { userId } = req.user;
            const {
                type = null,
                startTime = null,
                endTime = null,
                pageSize = 5,
                pageIndex = PAGINATION_CONSTANTS.default_index,
                actionId = null
            } = req.query;           
            //Lấy thông tin của user
            const currentUser = await users.findOne({
                where: {
                    userId: userId,
                },
                include: [{
                    model:  position,
                    as: "po",
                    attributes: ["rolePosId"]
                }]
            });
            const userGroup = await group.findOne({
                where: {
                    groupId: currentUser.groupId 
                }
            })
            const parentGroupIdOfUserGroup = userGroup.parentGroupId;
            var filter = {}
            var listAction = [1, 11, 30, 41, 20];
            let listGroupIdManaged = []
             //Neu la user
             if(currentUser.roleId !== 0){
                //Neu user la cap cuc
                if(parentGroupIdOfUserGroup === null && currentUser.po.rolePosId !== 3){
                    let groups;
                    //Neu user la cuc truong, lay danh sach tat cac cac phong la cap duoi
                    if(currentUser.po.rolePosId === 1){
                        groups = await group.findAll({
                            where: {
                                [Op.or]: [{
                                    parentGroupId: currentUser.groupId
                                },{
                                    groupId: currentUser.groupId
                                }]
                            }
                        });
                    }else if(currentUser.po.rolePosId === 2){
                        //Neu user la cuc pho, lay danh sach tat ca cac don vi do cuc pho quan ly
                        groups = await group.findAll({
                            where: {
                                managementBy: currentUser.userId
                            },
                            attributes: ["groupId"]
                        });
                    }
                    for(let index = 0; index < groups.length; index++){
                        listGroupIdManaged.push(groups[index].groupId)
                    }
                    if(startTime !== null && endTime !== null){
                        filter = {
                            ...filter,
                            createdDate: {
                                [Op.and]: {
                                    [Op.gte]: moment(startTime, 'YYYY-MM-DD').startOf('day'),
                                    [Op.lte]: moment(endTime, 'YYYY-MM-DD').endOf('day')
                                }
                            }
                        };
                        console.log("filter: ", filter);
                    }
                    // if(actionId !== null){
                    //     const userLimit = await activityLogs.findAll({
                    //         where: {
                    //             ...filter,
                    //             ...{
                    //                 ownerId: {
                    //                     [Op.in]: listUserId
                    //                 },
                    //                 actionId: parseInt(actionId)
                    //             }
                    //         },
                    //         attributes: [[sequelize.col('activityLogs.ownerId'), 'userId'],[sequelize.fn('count', sequelize.col('activityLogs.actionId')), 'value']],
                    //         group : ['activityLogs.actionId','activityLogs.ownerId'],
                    //         order: sequelize.literal('value DESC'),
                    //     });
                    //     listUserId = userLimit.map((e) => {
                    //         return e.dataValues.userId
                    //     });
                    // }
                    const paginationListGroup = listGroupIdManaged.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
                    const rows = await Promise.all(
                        paginationListGroup.map(async (e) => {
                            const row = await activityLogs.findAll({
                                where: {
                                    ...filter,
                                    ...{
                                        actionId:{
                                            [Op.in]: listAction
                                        },
                                    }
                                },
                                attributes: [[sequelize.col('activityLogs.actionId'),'action'], [sequelize.fn('count', sequelize.col('activityLogs.actionId')), 'value']],
                                group : ['activityLogs.actionId','owner->group_group.groupId'],
                                include: [{
                                    model: users,
                                    where: {
                                        groupId: e
                                    },
                                    as: "owner",
                                    attributes: [],
                                    include: {
                                        model: group,
                                        as: "group_group",
                                        attributes: ['displayName']
                                    }
                                }]
                            })
                            return {[e]: row}
                        })
    
                    )
                     //format data
                    const result = await Promise.all(
                        rows.map(async (e) => {
                            const _ = await onDataStatisticFormat(e);
                            return _;
                        })
                    )
                    return res.send(onSuccess({
                        data: result,
                        total: listGroupIdManaged.length,
                        pageIndex: parseInt(pageIndex),
                    }))
                }else{
                    var listUserId = [currentUser.userId];
                    if(currentUser.po.rolePosId === 2){
                        //Neu user là pho phong
                        //Lấy danh sách người dùng được quản lí bởi currentUserId
                        const listUsersManaged = await users.findAll({
                            where: {
                                [Op.or]: [{
                                    managementBy: currentUser.userId
                                },{
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
                    }else if(currentUser.po.rolePosId === 1){
                        //Neu la truong phong
                        //Lay danh sach nguoi dung la thuoc don vi
                        const rows = await users.findAll({
                            where: {
                                groupId: currentUser.groupId,
                                userId: {
                                    [Op.ne]: currentUser.userId
                                }
                            },
                            attributes: ["userId"]
                        });
                        for(let index = 0; index < rows.length; index++){
                            listUserId.push(rows[index].userId)
                        }
                    }
                    if(startTime !== null && endTime !== null){
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
                    if(actionId !== null){
                        const userLimit = await activityLogs.findAll({
                            where: {
                                ...filter,
                                ...{
                                    ownerId: {
                                        [Op.in]: listUserId
                                    },
                                    actionId: parseInt(actionId)
                                }
                            },
                            attributes: [[sequelize.col('activityLogs.ownerId'), 'userId'],[sequelize.fn('count', sequelize.col('activityLogs.actionId')), 'value']],
                            group : ['activityLogs.actionId','activityLogs.ownerId'],
                            order: sequelize.literal('value DESC'),
                        });
                        listUserId = userLimit.map((e) => {
                            return e.dataValues.userId
                        });
                    }
                    const paginationListUsers = listUserId.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
                    const rows = await Promise.all(
                        paginationListUsers.map(async (e) => {
                            const row = await activityLogs.findAll({
                                where: {
                                    ...filter,
                                    ...{
                                        actionId:{
                                            [Op.in]: listAction
                                        },
                                        ownerId: e
                                    }
                                },
                                attributes: [[sequelize.col('activityLogs.actionId'),'action'], [sequelize.fn('count', sequelize.col('activityLogs.actionId')), 'value']],
                                group : ['activityLogs.actionId'],
                            })
                            return {[e]: row}
                        })
                    )
                    //format data
                    const result = await Promise.all(
                        rows.map(async (e) => {
                            const _ = await _onDataStatisticFormat(e);
                            return _;
                        })
                    )

                    return res.send(onSuccess({
                        data: result,
                        total: listUserId.length,
                        pageIndex: parseInt(pageIndex),
                    }))
                }
             }
            

        }catch(error){
            console.log("error: ", error)
        }
    },
   
}