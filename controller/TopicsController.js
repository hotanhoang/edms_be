const { onError, onSuccess, onDataTopicFormat, onDataTopicShareFormat } = require("../utils/utils");
const { topic, domain, shareTopics, users, documents, notification } = require("../models/init-models");
const { Op, where, fn, col } = require("sequelize");
const { SALT, URL_API, ACTION_TYPE, PAGINATION_CONSTANTS, FILE_KEY_TOPIC, NotificationType } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const logger = require("../utils/logger");
const { uploadFileTopic } = require("../middleware/fileUpload");
const WordExtractor = require("word-extractor");
const pdf = require('pdf-parse');
const extractor = new WordExtractor();
const fs = require("fs");
const moment = require("moment")
const axios = require('axios');
const { sendNotificationToUser } = require("../utils/notification");

module.exports = {
  // API thêm mới một chủ đề
  addNewTopic: async (req, res) => {
    const { userId } = req.user;
    try {
      const topicInfo = req.body;
      // Kiểm tra hợp lệ lĩnh vực của chủ đề
      const domainInfo = await domain.findOne({
        where: { domainId: topicInfo.domainId },
      });
      if (domainInfo) {
        // Tạo mới một chủ đề
        const new_topic = await topic.create({
          ...topicInfo, // Các trường bao gồm title, domainId, andOrKeywords, notKeywords, description
          ownerId: userId,
        });
        // Ghi log
        await logAction(ACTION_TYPE.TOPIC_ACTION.CREATE_TOPIC, {
          ownerId: userId,
          topicId: new_topic.topicId,
          ipAddress: req.ip,
          visible: false,
          description: `Thêm chủ đề "${new_topic.displayName}" thành công`,
        });
        return res.send(onSuccess(new_topic));
      }
      return res.send(onError(404, "Lĩnh vực không tồn tại"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API chỉnh sửa thông tin chủ đề
  editTopic: async (req, res) => {
    const { userId } = req.user;
    try {
      const { topicId } = req.params;
      const entity = req.body;
      // Lấy thông tin topic từ topicId
      const topicInfo = await topic.findOne({
        where: { topicId },
      });
      // Kiểm tra nếu id người tạo trùng với id người (chỉnh sửa)? -> (người tạo)
      if (topicInfo && topicInfo.ownerId === userId) {
        // Thực hiện cập nhật thông tin chủ đề
        // title, domainId, andOrKeywords, notKeywords, description
        topicInfo.displayName = entity.displayName || topicInfo.displayName;
        topicInfo.andOrKeywords = entity.andOrKeywords || topicInfo.andOrKeywords;
        topicInfo.notKeywords = entity.notKeywords || topicInfo.notKeywords;
        topicInfo.description = entity.description || topicInfo.description;
        // Kiểm tra tồn tại của domain theo domainId (nếu có cập nhật)
        if (entity.domainId) {
          const domainInfo = await domain.findOne({
            where: { domainId: entity.domainId },
          });
          // Nếu domain đó không tồn tại
          if (!domainInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.TOPIC_ACTION.EDIT_TOPIC, {
            //   ownerId: userId,
            //   topicId: topicId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Lĩnh vực của chủ đề không tồn tại",
            // });
            return res.send(onError(404, "Lĩnh vực không tồn tại"));
          }
          // Cập nhật thêm thông tin domainId
          topicInfo.domainId = entity.domainId;
        }
        // Thực hiện cập nhật vào CSDL
        const topic_update = await topicInfo.save();
        // Ghi log
        await logAction(ACTION_TYPE.TOPIC_ACTION.EDIT_TOPIC, {
          ownerId: userId,
          topicId: topicId,
          ipAddress: req.ip,
          visible: false,
          description: `Chỉnh sửa chủ đề "${topicInfo.displayName}" thành công`,
        });
        return res.send(onSuccess(topic_update));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.TOPIC_ACTION.EDIT_TOPIC, {
      //   ownerId: userId,
      //   topicId: topicId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Tài khoản không được phép thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      // await logAction(ACTION_TYPE.TOPIC_ACTION.EDIT_TOPIC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá chủ đề
  deleteTopic: async (req, res) => {
    const { userId } = req.user;
    try {
      const { topicId } = req.params;
      // Lấy thông tin topic từ topicId
      const topicInfo = await topic.findOne({
        where: { topicId },
      });
      // Kiểm tra nếu id người tạo trùng với id người xoá
      if (topicInfo && topicInfo.ownerId === userId) {
        // Cập nhật trạng thái đã bị xoá
        topicInfo.enable = false;
        // Cập nhật thông tin vào CSDL
        await topicInfo.save();
        await logAction(ACTION_TYPE.TOPIC_ACTION.REMOVE_TOPIC, {
          ownerId: userId,
          topicId: topicId,
          ipAddress: req.ip,
          visible: false,
          description: `Xoá chủ đề "${topicInfo.displayName}" thành công`,
        });
        return res.send(onSuccess({}));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.TOPIC_ACTION.REMOVE_TOPIC, {
      //   ownerId: userId,
      //   topicId: topicId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Tài khoản không được phép thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      // await logAction(ACTION_TYPE.TOPIC_ACTION.REMOVE_TOPIC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API chia sẻ chủ đề
  shareTopic: async (req, res) => {
    const { userId } = req.user;
    try {
      var entity = req.body;
      const topicId = entity.topicId;
      // Lấy thông tin topic từ topicId
      const topicInfo = await topic.findOne({
        where: { topicId },
      });
      const userInfo = await users.findOne({
        where: {
          userId: userId,
        }
      })
      // Kiểm tra id người tạo có trùng với id của người dùng
      if (topicInfo.ownerId === userId) {
        // Kiểm tra topic có tồn tại hay không?
        if (topicInfo && topicInfo.enable) {
          const listShareUserIds = entity.listShareUserId;
          // Thêm user được chia sẽ topic vào bảng shareTopics
          for (let index = 0; index < listShareUserIds.length; index++) {
            const shareUserId = listShareUserIds[index];
            // Không tạo bản ghi chia sẻ với chính user
            if (shareUserId !== topicInfo.ownerId) {
              const inShareTopics = await shareTopics.findOne({
                where: {
                  topicId,
                  shareUserId,
                },
              });
              // Nếu userId chưa được chia sẻ topic hiện tại
              if (!inShareTopics) {
                await shareTopics.create({
                  topicId: topicId,
                  shareUserId: shareUserId,
                  ownerId: topicInfo.ownerId,
                });
              } else {
                if (!inShareTopics.enable) {
                  inShareTopics.enable = true;
                  inShareTopics.createdDate = new Date()
                  await inShareTopics.save();
                }
              }
            }
          }
          // listShareUserIds.forEach(async (shareUserId) => {

          // });
          // Ghi log
          const topicNotification = await logAction(ACTION_TYPE.TOPIC_ACTION.SHARE_TOPIC, {
            ownerId: userId,
            topicId: topicId,
            ipAddress: req.ip,
            visible: true,
            description: `Chia sẻ chủ đề "${topicInfo.displayName}" thành công`,
          });
          listShareUserIds.forEach( async (id) => {
            const topicContent = {
              userId: id,
              activityLogId: topicNotification.id,
              read: false,
              displayName: `"${userInfo.displayName}" đã chia sẻ cho bạn chủ đề "${topicInfo.displayName}"`
            }
            await notification.create(topicContent);
            sendNotificationToUser(
              id, 
              NotificationType.NOTIFICATION_SHARE_TOPIC,
              `"${userInfo.displayName}" đã chia sẻ cho bạn chủ đề "${topicInfo.displayName}"`
            )
          })
          return res.send(onSuccess({content: `"${userInfo.displayName}" đã chia sẻ cho bạn chủ đề "${topicInfo.displayName}"`}));
        }
        // Ghi log
        // await logAction(ACTION_TYPE.TOPIC_ACTION.SHARE_TOPIC, {
        //   ownerId: userId,
        //   topicId: topicId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: "Chia sẻ không thành công do chủ đề không tồn tại",
        // });
        return res.send(
          onError(404, "Không thành công do chủ đề không tồn tại")
        );
      }
      // Ghi log
      // await logAction(ACTION_TYPE.TOPIC_ACTION.SHARE_TOPIC, {
      //   ownerId: userId,
      //   topicId: topicId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: "Tài khoản không có quyền thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không có quyền"));
    } catch (error) {
      // await logAction(ACTION_TYPE.TOPIC_ACTION.SHARE_TOPIC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá chia sẻ chủ đề
  deleteShareTopic: async (req, res) => {
    const { userId } = req.user;
    try {
      const { topicId, shareUserId } = req.body;
      // Lấy thông tin topic từ topicId
      const topicInfo = await topic.findOne({
        where: { topicId },
      });
      const ownerId = topicInfo.ownerId;
      if (userId === ownerId) {
        const shareTopic = await shareTopics.findOne({
          where: { topicId, shareUserId, ownerId },
        });
        if (shareTopic) {
          // Cập nhật trạng thái đã bị xoá
          shareTopic.enable = false;
          // Cập nhật thông tin vào CSDL
          await shareTopic.save();
          await logAction(ACTION_TYPE.TOPIC_ACTION.REMOVE_SHARE_TOPIC, {
            ownerId: userId,
            topicId: topicId,
            ipAddress: req.ip,
            visible: false,
            description: `Xoá chia sẻ chủ đề "${topicInfo.displayName}" thành công`,
          });
          return res.send(onSuccess({}));
        }
      }
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách chủ đề
  getListTopics: async (req, res) => {
    try {
      const { userId } = req.user;
      const pagination = req.pagination;
      const { owner = true, inTopicId,
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
        domainId,
        createdDateStart, // Thời gian tải lên (ngày tạo - lấy giữa 2 khoảng ngày)
        createdDateEnd,
        displayName,
        keyword
      } = req.query;
      const ownerQuery = JSON.parse(owner);

    
      const keyWordQuery = 
        keyword !== undefined && keyword.trim() !== ''
          ? {
            andOrKeywords: {
              [Op.contains]: keyword.trim() 
            }
          }
          : {}
      console.log("keyWordQuery: ", keyWordQuery);
      const displayNameQuery = 
        displayName !== undefined && displayName.trim() !== ''
          ? {
            displayName: where(
              fn("LOWER", col("topic.displayName")),
              "LIKE",
              "%" + displayName.trim().toLowerCase() + "%"
          ),
          }
          : {}
      const domainQuery =
        domainId !== undefined
          ? {
            domainId: JSON.parse(domainId),
          }
          : {};

      const createdDateQuery =
        createdDateStart !== undefined && createdDateEnd !== undefined ?
          {
            createdDate: {
              [Op.and]: {
                [Op.gte]: moment(createdDateStart, 'YYYY-MM-DD').startOf('day'),
                [Op.lte]: moment(createdDateEnd, 'YYYY-MM-DD').endOf('day')
              }
            }
          } : {}
      const filterParams = {
        ...domainQuery,
        ...createdDateQuery,
        ...displayNameQuery,
        ...keyWordQuery
      }
      var _filter = {
      };
      // Khởi tạo bộ lọc với offset và limit
      var filter = {
        offset: pagination.offset,
        limit: pagination.limit,
        order: [["createdDate", "DESC"]],
      };
      // Nếu inTopicId tồn tại thì bổ sung thêm vào điều kiện truy vấn
      if (inTopicId) {
        _filter = {
          ..._filter,
          ...filterParams,
          topicId: inTopicId,
        };
      }
      // Nếu owner thì bổ sung thêm điều kiện truy vấn với topic là của chính userId tạo
      if (ownerQuery) {
        filter = {
          ...filter,
          ...{
            where: {
              ..._filter,
              ...filterParams,
              ownerId: userId,
              enable: true,
              auto: false,
            },
            distinct: true,
            include: [
              {
                model: shareTopics,
                as: "shareTopics",
                required: false,
                order: [["createdDate", "DESC"]],
                where: {
                  enable: true,
                },
                // Chỉ lấy các thuộc tính
                attributes: ["shareUserId", "createdDate"],
                include: [{
                  model: users,
                  as: "shareUser",
                  // Chỉ lấy các thuộc tính
                  attributes: ["userId", "displayName", "avatar"],
                }]
              },
              {
                model: domain,
                as: "domain",
                // Chỉ lấy các thuộc tính
                attributes: ["domainId", "displayName"],
              },
              {
                model: users,
                as: "owner",
                // Chỉ lấy các thuộc tính
                attributes: ["userId", "displayName", "avatar"],
              }
            ]
          },
        };
        // let data = await topic.findAll(filter);
        const { count, rows } = await topic.findAndCountAll(filter);
        const results = rows.map((e) => {
          return onDataTopicFormat(e);
        });
        // await logAction(ACTION_TYPE.GET, {
        //   description: "Lấy danh sách topic thành công",
        // });
        return res.send(onSuccess({
          listTopics: results,
          pageSize: parseInt(pageSize),
          pageIndex: parseInt(pageIndex),
          count,
        }));
      } else {
        // Lấy listTopic mà userId được chia sẻ trong shareTopic
        filter = {
          ...filter,
          ...{
            // attributes: ["topicId", "ownerId"],
            where: {
              ..._filter,
              ...{
                shareUserId: userId,
                enable: true,
              },
            },
            distinct: true,
            include: {
              model: topic,
              as: "topic",
              where: {
                ...filterParams,
              },
              include: [
                {
                  model: shareTopics,
                  as: "shareTopics",
                  required: false,
                  order: [["createdDate", "DESC"]],
                  where: {
                    enable: true,
                    // shareUserId: {
                    //   [Op.ne]: userId
                    // }
                  },
                  // Chỉ lấy các thuộc tính
                  attributes: ["shareUserId", "createdDate"],
                  include: [{
                    model: users,
                    as: "shareUser",
                    // Chỉ lấy các thuộc tính
                    attributes: ["userId", "displayName", "avatar"],
                  }]
                },
                {
                  model: domain,
                  as: "domain",
                  // Chỉ lấy các thuộc tính
                  attributes: ["domainId", "displayName"],
                },
                {
                  model: users,
                  as: "owner",
                  // Chỉ lấy các thuộc tính
                  attributes: ["userId", "displayName", "avatar"],
                }
              ]
            },
          },
        };
        // let data = await shareTopics.findAll(filter);
        const { count, rows } = await shareTopics.findAndCountAll(filter);
        const results = rows.map((e) => {
          return onDataTopicShareFormat(e);
        });
        // await logAction(ACTION_TYPE.GET, {
        //   description: "Lấy danh sách topic thành công",
        // });
        return res.send(onSuccess({
          listTopics: results,
          pageSize: parseInt(pageSize),
          pageIndex: parseInt(pageIndex),
          count,
        }));
      }
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy upload file và lấy key work
  getKeyWordTopic: async (req, res) => {
    try {
      uploadFileTopic(req, res, async (err) => {
        if (err) {
          return res.send(onError(500, err));
        }
        let content = []
        if (req.files.length !== 0) {
          for (let i = 0; i < req.files.length; i++) {
            const { fieldname, filename } = req.files[i];
            // Đọc lần lượt nội dung của file upload lên
            try {
              if (filename.split('.').pop() === "pdf") {
                let dataBuffer = fs.readFileSync(`${FILE_KEY_TOPIC}/${filename}`);
                const doc = await pdf(dataBuffer)
                content.push(doc.text)
              } else {
                if (filename.split('.').pop() === "doc" || filename.split('.').pop() === "docx") {
                  const doc = await extractor.extract(`${FILE_KEY_TOPIC}/${filename}`)
                  content.push(doc.getBody())
                }
              }
              // Xoá file vừa đọc trên ổ đĩa
              fs.rmSync(`${FILE_KEY_TOPIC}/${filename}`, { recursive: true, force: true });
            } catch (error) {
            }
          }
        }
        const config = {
          method: 'post',
          url: `${URL_API}/KeyBertArr`,
          data: {
            text: content
          }
        }
        let result = await axios(config)

        // Gọi API để lấy key word với đầu vào {text : content}
        return res.send(onSuccess(result.data));
      })
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API chọn file và lấy key word
  getKeyFromDrive: async (req, res) => {
    try {
      const { listDocumentId } = req.body;
      // Lấy danh sách doc nằm trong listDocumentId
      const listDocuments = await documents.findAll({
        where: {
          documentId: {
            [Op.in]: listDocumentId
          },
          enable: true, // Không bị xoá
          recycleBin: false, // Không bị di chuyển thùng rác
        },
        // order: [["createdDate", "ASC"]],
        // include: {
        //   model: typeOfFile,
        //   as: "typeOfFile",
        // },
      });
      // Lấy tất cả content trong listDocuments
      let content = []
      if (listDocuments.length !== 0) {
        listDocuments.forEach(e => {
          content.push(e.content || "")
        });

        const config = {
          method: 'post',
          url: `${URL_API}/KeyBertArr`,
          data: {
            text: content
          }
        }
        let result = await axios(config)
        // Gọi API để lấy key word với đầu vào {text : content}
        return res.send(onSuccess(result.data));
      }
      return res.send(onSuccess([]));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy tất cả danh sách chủ đề (Bao gồm cả chủ đề được chia sẻ)
  getListAllTopics: async (req, res) => {
    try {
      const { userId } = req.user;
      const pagination = req.pagination;
      const {
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
      } = req.query;
      // Lấy danh sách chủ đề được chia sẻ với userId
      const resultShare = await shareTopics.findAll({
        where: {
          shareUserId: userId,
          enable: true,
        },
      })
      // Danh sách chủ sở hữu của chủ đề
      const listOwner = resultShare.map(e => e.ownerId)
      // Lấy danh sách chủ đề
      var filter = {
        // offset: pagination.offset,
        // limit: pagination.limit,
        order: [["enable", "DESC"], ["createdDate", "DESC"]],
      };

      filter = {
        ...filter,
        ...{
          where: {
            [Op.or]: [{
              ownerId: userId, // Chủ sở hữu
            }, {
              ownerId: {
                [Op.in]: listOwner // được chia sẻ
              }
            }],
            enable: true,
          },
        }
      }
      const { count, rows } = await topic.findAndCountAll(filter);
      const results = rows.map((e) => {
        return {
          topicId: e.topicId,
          displayName: e.displayName,
          enable: e.enable
        };
      });
      // await logAction(ACTION_TYPE.GET, {
      //   description: "Lấy danh sách chủ đề thành công",
      // });
      return res.send(onSuccess({
        listTopics: results,
        pageSize: parseInt(pageSize),
        pageIndex: parseInt(pageIndex),
        count,
      }));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
};
