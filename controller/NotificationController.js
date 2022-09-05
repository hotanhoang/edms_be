const { onError, onSuccess } = require("../utils/utils");
const { group, users, position, notification, activityLogs } = require("../models/init-models");
const { ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { Op } = require("sequelize");
const moment = require("moment")


module.exports = {
    seenNotification: async (req, res) => {
        try{
            const { userId } = req.user;
            const { notificationId = null } = req.query;
            if(notificationId !== null){
                await notification.update({
                    read: true
                }, {
                    where: {
                        id: notificationId
                    }
                })
            }else{
                await notification.update({
                    read: true
                }, {
                    where: {
                        userId: userId
                    }
                })
            }
            return res.send(onSuccess({}))
        }catch(error){
            console.log("error > ", error)
        }
    },
    getNumberOfNotifications: async (req, res) => {
        try{  
            const { userId } = req.user;
            const { inRead = null } = req.query;
            // const userInfo = await users.findOne({
            //     where: {
            //         userId: userId
            //     }
            // });
            if(inRead !== null){
                const backdate = moment().subtract(30, 'days').format("YYYY-MM-DD");
                const nowdate = moment().format("YYYY-MM-DD");
                const numberOfNotifications = await notification.count({
                    where:{
                        userId: userId,
                        read: inRead,
                    },
                    include: [{
                        model: activityLogs,
                        as: "activityLog",
                        where: {
                            createdDate: {
                                [Op.and]: {
                                    [Op.gte]: moment(backdate, 'YYYY-MM-DD').startOf('day'),
                                    [Op.lte]: moment(nowdate, 'YYYY-MM-DD').endOf('day')
                                }
                            }
                        }
                    }]  
                    
                });
                return res.send(onSuccess({numberNotifications: numberOfNotifications}))
            }   
        }catch(error){
            console.log("error > ", error)
        }
    },
    getListNotification: async(req, res) => {
        try{
            const { userId } = req.user;
            const { inRead = null, pageSize = PAGINATION_CONSTANTS.default_size, pageIndex = PAGINATION_CONSTANTS.default_index } = req.query;
            const pagination = req.pagination;
            const filterPagination = {
                // offset: pagination.offset,
                // limit: pagination.limit,
                order: [['id', "DESC"]],
            };
            let filter = {
                userId: userId,
            }
            if(inRead !== null){
                filter = {
                    ...filter,
                    read: inRead
                    
                }
            }
            const backdate = moment().subtract(30, 'days').format("YYYY-MM-DD");
            const nowdate = moment().format("YYYY-MM-DD");
            const { count, rows } = await notification.findAndCountAll({
                where: filter,
                ...filterPagination,
                include: [{
                    model: activityLogs,
                    as: "activityLog",
                    where: {
                        createdDate: {
                            [Op.and]: {
                                [Op.gte]: moment(backdate, 'YYYY-MM-DD').startOf('day'),
                                [Op.lte]: moment(nowdate, 'YYYY-MM-DD').endOf('day')
                            }
                        },
                    },
                    include: [{
                        model: users,
                        as: "owner",
                        attributes: ["displayName", "avatar"],
                    }],
                    attributes: ["ownerId","documentId","createdDate"],
                    
                }]  
                
            });
            return res.send(onSuccess({
                ListNotifications: rows,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        }catch(error){
            console.log("error > ", error)
        }
    }
}