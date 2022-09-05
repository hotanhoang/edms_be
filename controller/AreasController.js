const { onError, onSuccess } = require("../utils/utils");
const { area, users, nation, events } = require("../models/init-models"); 
const { ROLE_TYPES, ACTION_TYPE, PAGINATION_CONSTANTS } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { Op, where, fn, col } = require("sequelize");

module.exports = {
    displayNameIsExisted: async (req, res) => {
        try{
            const {displayName = null} = req.query;
            if(displayName !== null){
                const numberOfDisplayName = await area.count({
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
    //API Thêm mới khu vực
    addNewArea: async (req, res) => {
        try{
            const { userId } = req.user;
            const { displayName, description } = req.body;
            //Lấy thông tin user
            const userInfo = await users.findOne({
                where: {userId: userId}
            });
            if(userInfo && userInfo.enable){
                //Kiểm tra xem có phải admin hay không?
                if(userInfo.roleId === ROLE_TYPES.ADMIN){
                    if(displayName){
                        //Kiểm tra tên khu vực đã tồn tại hay chưa?
                        const areaInfo = await area.findOne({
                            where: {
                                    displayName: displayName.trim(),
                                    enable: true,
                                }
                        });
                        if(areaInfo!==null){
                            return res.send(onError(405, 'Tên khu vực đã tồn tại'))
                        }
                        const newArea = await area.create({
                            displayName: displayName.trim(),
                            description: description,
                        });
                        return res.send(onSuccess({areaId: newArea.areaId}))
                    }else{
                        return res.send(onError(402, "Tên khu vực không hợp lệ"));
                    }
                }else{
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        }catch(error){
            return res.send(onError(500, error));
        }
    },
    //API chỉnh sửa thông tin khu vực
    editArea: async(req, res) => {
        try {
            const { userId } = req.user;
            const { areaId } = req.params;
            const { displayName, enable, description } = req.body;
            //Lấy thông tin của user từ userId
            const userInfo = await users.findOne({
                where: {userId: userId}
            });
            if(userInfo && userInfo.enable){
                if(userInfo.roleId === ROLE_TYPES.ADMIN){
                    //kiểm tra xem areaId có tồn tại hay không?
                    const areaInfo = await area.findOne({
                        where: {
                            areaId: areaId,
                            enable: true,
                        }
                    });
                    
                    if(areaInfo!==null){
                        //Kiểm tra xem displayName đã tồn tại hay chưa?
                        if(displayName !== areaInfo.displayName && displayName){
                            const noDisplayName = await area.count({
                                where: {
                                    displayName: displayName.trim(),
                                    enable: true,
                                }
                            });
                            //Nếu displayName chưa tồn tại
                            if(noDisplayName === 0){
                                areaInfo.displayName = displayName.trim();
                                areaInfo.description = description;
                                const areaUpdate = await areaInfo.save();
                                return res.send(onSuccess({areaId: areaUpdate.areaId}))
                            }else{
                                return res.send(onError(405, "Tên khu vực đã tồn tại", {}))
                            }
                        }
                        //Xoá khu vực
                        if(enable === false){
                            areaInfo.enable = false;
                            await nation.update({
                                areaId: null
                            },{
                                where: {
                                    areaId: areaId
                                }
                            })
                            await events.update({
                                areaId: null
                            },{
                                where: {
                                    areaId: areaId
                                }
                            })
                            await areaInfo.save();
                            return res.send(onSuccess({}))
                        }
                        //Cập nhật description
                        areaInfo.description = description;
                        await areaInfo.save();
                        return res.send(onSuccess({}))
                    }else{
                        return res.send(onError(404, "Định danh không tồn tại", {}))
                    }
                }else{
                    return res.send(onError(401, "Tài khoản không có quyền", {}))
                }
            }
        }catch(error){
            return res.send(onError(500, error))
        }
    },
    //API lấy danh sách khu vực
    getListAreas: async(req,res) => {
        try{
            const pagination = req.pagination;
            const {
                areaId,
                enable = true,
                pageSize = PAGINATION_CONSTANTS.default_size,
                pageIndex = PAGINATION_CONSTANTS.default_index,
                keyword,
            } = req.query;
            let textSearch = keyword ? req.query.keyword.trim() : ''; // Search using keyword

            
            const filterPagination = {
                offset: pagination.offset,
                limit: pagination.limit,
                order: [["areaId", "DESC"]],
              };
            
            if(textSearch !== "")
                var { count, rows } = await area.findAndCountAll({
                    ...filterPagination,
                    where: {
                        displayName: where(
                            fn("LOWER", col("area.displayName")),
                            "LIKE",
                            "%" + textSearch.toLowerCase() + "%"
                        ),
                        enable: true
                    },
                });
            else   
                var { count, rows } = await area.findAndCountAll({
                    ...filterPagination,
                    where: {
                        enable: true
                    }
                });
            return res.send(onSuccess({
                listAreas: rows,
                pageSize: parseInt(pageSize),
                pageIndex: parseInt(pageIndex),
                count,
            }))
        }catch(error){
            return res.send(onError(500, error))
        }
    },
    getAllAreas: async(req, res) => {
        try {
            var { count, rows } = await area.findAndCountAll({
                where: {
                    enable: true
                }
            });
            return res.send(onSuccess({
                listAreas: rows,
                count,
            }))

        }catch(error){
            return res.send(onError(500, error))
        }
    }
}