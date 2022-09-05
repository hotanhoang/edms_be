const {
    onError,
    onSuccess,
} = require("../utils/utils");
const {
    users,
    aiConfig, aiCore, algorithm, mapAlgTypeAI, typeAI
} = require("../models/init-models");
const fs = require("fs");
const { Op, where, fn, col } = require("sequelize");
const {
    ROLE_TYPES,
} = require("../utils/constants");
const { logAction } = require("../utils/activityLog");

module.exports = {
    // API thêm mới hoặc cập nhật cấu hình tóm tắt văn bản
    addSumConfig: async (req, res) => {
        try {
            const { userId } = req.user;
            // console.log('userInfo : ', userId)
            const { listAIConfig, configAll } = req.body
            // Lấy thông tin của user
            const userInfo = await users.findOne({
                where: { userId },
            });
            // Tạo danh sách người dùng
            var listUser = []
            var defaultConfig = true
            if (userInfo.roleId === ROLE_TYPES.ADMIN) {
                // Nếu có điều kiện lọc thì truy vấn listUser từ aiConfig
                var configAllFilter = {}
                // Nếu không phải cấu hình cho tất cả user thì là cấu hình cho những user có default = true
                if (configAll === false) {
                    configAllFilter = {
                        default: true
                    }
                }
                const listUserConfig = await aiConfig.findAll({
                    where: configAllFilter
                })
                // console.log('listUserConfig : ', listUserConfig)
                listUserConfig.forEach(e => {
                    if (!listUser.includes(e.userId)) {
                        listUser.push(e.userId)
                    }
                });
            } else {
                defaultConfig = false
                listUser.push(userId)
            }
            // Duyệt lần lượt aiConfigItem trong listAIConfig
            for (let index = 0; index < listAIConfig.length; index++) {
                const aiConfigItem = listAIConfig[index];
                // Truy vấn thông tin trong bảng mapAlgTypeAI
                const listMapAlgTypeAI = await mapAlgTypeAI.findAll({
                    where: {
                        aiId: aiConfigItem.aiId,
                        typeAIId: aiConfigItem.typeAIId
                    }
                })
                // Danh sách các mapAlgTypeAI
                const mapAlgTypeAIs = listMapAlgTypeAI.map(a => a.mapAlgTypeAIId)
                // Kết hợp giữa mapAlgTypeAIs và listUser để cập nhật mapAlgTypeAIId = aiConfigItem.algorId cho bảng aiConfig
                // Tìm mapAlgTypeAIId trong listMapAlgTypeAI dựa vào aiConfigItem.algorId
                const mapAlgTypeAIIdIndex = listMapAlgTypeAI.findIndex(e => e.algorId === aiConfigItem.algorId)
                // console.log('mapAlgTypeAIId : ', mapAlgTypeAIs[mapAlgTypeAIIdIndex], aiConfigItem.algorId)
                await aiConfig.update({
                    default: defaultConfig,
                    updateTime: new Date(),
                    mapAlgTypeAIId: mapAlgTypeAIs[mapAlgTypeAIIdIndex],
                    longSum: aiConfigItem.longSum || null
                }, {
                    where: {
                        mapAlgTypeAIId: {
                            [Op.in]: mapAlgTypeAIs,
                        },
                        userId: {
                            [Op.in]: listUser,
                        }
                    },
                });
            }
            return res.send(onSuccess({}))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API lấy danh sách các cấu hình thuật toán
    getAlgorConfig: async (req, res) => {
        try {
            // Lấy tất cả dannh sách aiCore
            const listAICore = await aiCore.findAll({
                include: [
                    {
                        model: mapAlgTypeAI,
                        as: "mapAlgTypeAIs",
                        where: {
                            enable: true
                        },
                        include: [{
                            model: typeAI,
                            as: "typeAI",
                        }, {
                            model: algorithm,
                            as: "algor",
                        }
                        ]
                    }
                ]
            })
            // Định dạng lại data hiển thị danh sách các thuật toán
            // var dataAlgor = []
            // listAICore.forEach(a => {
            //     var aiCoreItem = {}
            //     var dataTypeAI = []
            //     a.mapAlgTypeAIs.forEach(e => {
            //     });
            //     dataAlgor.push({
            //     })
            // });
            return res.send(onSuccess(listAICore))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API lấy cấu hình của user
    getUserConfig: async (req, res) => {
        try {
            const { userId } = req.user;
            // Truy vấn thông tin từ bảng aiConfig với dk userId = userId
            // Sau đó lấy thông tin chi tiết của aiCore, algor, typeAI từ bảng mapAlgor với đk mapId = aiConfig.mapId
            const aiConfigInfo = await aiConfig.findAll({
                where: {
                    userId
                },
                include: [
                    {
                        model: mapAlgTypeAI,
                        as: "mapAlgTypeAI",
                        include: [{
                            model: aiCore,
                            as: "ai",
                        }, {
                            model: typeAI,
                            as: "typeAI",
                        }, {
                            model: algorithm,
                            as: "algor",
                        }
                        ]
                    }
                ]
            })
            return res.send(onSuccess(aiConfigInfo))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API thiết lập cấu hình về mặc định
    setConfigDefault: async (req, res) => {
        try {
            const { userId } = req.user;
            // Lấy thông tin cấu hình của một admin nào đó
            // Sau đó cập nhật thông tin cấu hình đó với điều kiện userId = userId
            const aiConfigInfo = await aiConfig.findAll()
            var listUser = []
            aiConfigInfo.forEach(e => {
                if (!listUser.includes(e.userId)) {
                    listUser.push(e.userId)
                }
            });
            const userInfo = await users.findOne({
                where: {
                    userId: {
                        [Op.in]: listUser
                    },
                    roleId: ROLE_TYPES.ADMIN
                }
            })
            // console.log('userInfo : ',userInfo.userId)
            // Lấy tất cả config của userInfo.userId
            const listConfig = await aiConfig.findAll({
                where: {
                    userId: userInfo.userId
                }
            })
            // Tạo các bản ghi mới cho userId
            var listConfigOfUser = []
            listConfig.forEach(e => {
                listConfigOfUser.push({
                    mapAlgTypeAIId: e.mapAlgTypeAIId,
                    userId: userId,
                    updateTime: new Date(),
                    default: true,
                    longSum: e.longSum
                })
            });
            // Xoá tất cả config của userId
            await aiConfig.destroy({
                where: { userId },
            });
            // Thêm mới các bản ghi
            await aiConfig.bulkCreate(listConfigOfUser);
            return res.send(onSuccess({}))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API thêm mới thuật toán
    addAlgor: async (req, res) => {
        try {
            const { listMapAlgTypeAI } = req.body
            // mapAlgTypeAI = {
            //     mapAlgTypeAIId: "", // Ánh xạ thuật toán tóm tắt
            //     aiId: "", // Đơn văn bản(ngắn/ dài) / đa văn bản
            //     typeAIId: "", // Tóm tắt trích rút/ tóm lược
            //     algorId: "", // Id thuật toán
            //     displayName: "", // Tên thuật toán
            //     description: "", // Mô tả thuật toán
            //     urlAPI: "", // url API
            //     needPercentLong: "", //
            //     needKeywords: ""
            // }
            for (let index = 0; index < listMapAlgTypeAI.length; index++) {
                const element = listMapAlgTypeAI[index];
                if (!element.mapAlgTypeAIId) {
                    return res.send(onError(404, `Not found mapAlgTypeAIId`));
                }
                // Truy vấn lần lượt element.aiId, element.typeAIId, element.algorId
                const aiCoreInfo = await aiCore.findOne({
                    where: {
                        aiId: element.aiId
                    }
                })
                if (!aiCoreInfo) {
                    return res.send(onError(404, `Not found aiId`));
                }
                const typeAIInfo = await typeAI.findOne({
                    where: {
                        typeAIId: element.typeAIId
                    }
                })
                if (!typeAIInfo) {
                    return res.send(onError(404, `Not found typeAIId`));
                }
                const mapAlgType = await mapAlgTypeAI.findOne({
                    where: {
                        [Op.or]: [
                            {
                                mapAlgTypeAIId: element.mapAlgTypeAIId
                            },
                            {
                                aiId: element.aiId,
                                typeAIId: element.typeAIId,
                                algorId: element.algorId
                            }
                        ]
                    }
                })
                if (mapAlgType) {
                    return res.send(onError(405, `mapAlgTypeAI is exist`));
                }
                const algorInfo = await algorithm.findOne({
                    where: {
                        algorId: element.algorId
                    }
                })
                const dataInsert = {
                    mapAlgTypeAIId: element.mapAlgTypeAIId,
                    aiId: element.aiId, // Đơn văn bản(ngắn/ dài) / đa văn bản
                    typeAIId: element.typeAIId, // Tóm tắt trích rút/ tóm lược
                    algorId: element.algorId, // Id thuật toán
                }
                if (!algorInfo) {
                    // Thêm mới thuật toán trong CSDL
                    await algorithm.create({
                        algorId: element.algorId, // Id thuật toán
                        displayName: element.displayName, // Tên thuật toán
                        description: element.description, // Mô tả thuật toán
                        urlAPI: element.urlAPI, // url API
                        needPercentLong: element.needPercentLong, //
                        needKeywords: element.needKeywords
                    })
                }
                // Thêm mới mapAlgTypeAI
                await mapAlgTypeAI.create(dataInsert)
            }
            return res.send(onSuccess({}))
        } catch (error) {
            return res.send(onError(500, error));
        }
    },
    // API tạm dừng/ khôi phục thuật toán
    editAlgor: async (req, res) => {
        try {
            const { listMapAlgTypeAI } = req.body
            const listMapAlgTypeAIId = listMapAlgTypeAI.map(e => {
                if (e.mapAlgTypeAIId) {
                    return e.mapAlgTypeAIId
                } else {
                    return res.send(onError(404, `listMapAlgTypeAI Not found mapAlgTypeAIId`));
                }
            })
            console.log('listMapAlgTypeAIId : ', listMapAlgTypeAIId)
            for (let index = 0; index < listMapAlgTypeAI.length; index++) {
                const element = listMapAlgTypeAI[index];
                const mapAlgType = await mapAlgTypeAI.findOne({
                    where: {
                        mapAlgTypeAIId: element.mapAlgTypeAIId,
                        aiId: element.aiId,
                        typeAIId: element.typeAIId,
                        algorId: element.algorId
                    }
                })
                if (!mapAlgType) {
                    return res.send(onError(404, `Not found ${element.mapAlgTypeAIId}`));
                }
                if (element.enable) {
                    // Cập nhật enable = true cho mapAlgType vừa lấy được
                    mapAlgType.enable = true
                    await mapAlgType.save()
                } else {
                    if (mapAlgType.enable) {
                        // Cập nhật enable = false cho mapAlgType vừa lấy được
                        mapAlgType.enable = false
                        await mapAlgType.save()
                        // Đồng thời tìm mapAlgType khác để thay thế để cập nhật toàn bộ mapAlgTypeAIId cho những người dùng sử dụng element.mapAlgTypeAIId

                        // Lấy tất cả các user là admin
                        const listUserAdmin = await users.findAll({
                            where: {
                                roleId: ROLE_TYPES.ADMIN,
                                enable: true
                            }
                        })
                        const listUserId = listUserAdmin.map(a => a.userId)
                        console.log('listUserId ; ', listUserId)
                        // Lấy tất cả các mapAlgTypeAI thoả mãn
                        // mapAlgTypeAIId không nằm trong listMapAlgTypeAIId
                        // aiId = element.aiId, typeAIId = element.typeAIId
                        const listMap = await mapAlgTypeAI.findAll({
                            where: {
                                mapAlgTypeAIId: {
                                    [Op.notIn]: listMapAlgTypeAIId
                                },
                                aiId: element.aiId,
                                typeAIId: element.typeAIId,
                                enable: true
                            }
                        })
                        const listMapId = listMap.map(s => s.mapAlgTypeAIId)
                        console.log('listMapId : ', listMapId)

                        // Lấy thông tin cấu hình của một admin thoả mãn điều kiện đã lấy ở trên
                        const aiConfigAdmin = await aiConfig.findOne({
                            where: {
                                userId: {
                                    [Op.in]: listUserId
                                },
                                mapAlgTypeAIId: {
                                    [Op.in]: listMapId
                                }
                            }
                        })
                        // Nếu không có thuật toán nào của admin để thay thế thì tìm 1 thuật toán cùng loại
                        console.log('aiConfigAdmin : ', aiConfigAdmin)
                        if (!aiConfigAdmin) {
                            if (listMapId.length === 0) {
                                return res.send(onError(404, `No configuration found to replace`));
                            }
                            await aiConfig.update(
                                {
                                    mapAlgTypeAIId: listMapId[0],
                                },
                                {
                                    where: {
                                        mapAlgTypeAIId: element.mapAlgTypeAIId,
                                    },
                                }
                            );
                        } else {
                            // Cập nhật cho tất cả người dùng đang sử dụng element.mapAlgTypeAIId
                            await aiConfig.update(
                                {
                                    mapAlgTypeAIId: aiConfigAdmin.mapAlgTypeAIId,
                                },
                                {
                                    where: {
                                        mapAlgTypeAIId: element.mapAlgTypeAIId,
                                    },
                                }
                            );
                        }
                    }
                }
            }
            return res.send(onSuccess({}))
        } catch (error) {
            return res.send(onError(500, error));
        }
    }
}