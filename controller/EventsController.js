const { onError, onSuccess, onDataEventFormat, onDataEventShareFormat } = require("../utils/utils");
const {
  events,
  domain,
  nation,
  topic,
  shareEvents,
  users, area,
  notification
} = require("../models/init-models");
const { ACTION_TYPE, PAGINATION_CONSTANTS, TIME_ZONE_STRING, NotificationType } = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const moment = require("moment");
const { sendNotificationToUser } = require("../utils/notification");

module.exports = {
  // API thêm mới sự kiện
  addNewEvent: async (req, res) => {
    const { userId } = req.user;
    try {
      const eventInfo = req.body;
      // Kiểm tra hợp lệ lĩnh vực của sự kiện
      const domainInfo = await domain.findOne({
        where: { domainId: eventInfo.domainId },
      });
      if (!domainInfo) {
        return res.send(onError(404, "Mã domainId không tồn tại"));
      }
      // Kiểm tra hợp lệ quốc gia của sự kiện (Nếu có)
      if (eventInfo.nationId) {
        const nationInfo = await nation.findOne({
          where: { nationId: eventInfo.nationId },
        });
        if (!nationInfo) {
          return res.send(onError(404, "Mã nationId không tồn tại"));
        }
      }
      // Kiểm tra hợp lệ khu vực của sự kiện(Nếu có)
      if (eventInfo.areaId) {
        const areaInfo = await area.findOne({
          where: { areaId: eventInfo.areaId },
        });
        if (!areaInfo) {
          return res.send(onError(404, "Mã areaId không tồn tại"));
        }
      }
      // Tạo mới sự kiện
      if (eventInfo.startTime) {
        eventInfo.startTime = moment(eventInfo.startTime, 'YYYY-MM-DD').tz(TIME_ZONE_STRING).startOf('day')
      }
      if (eventInfo.endTime) {
        eventInfo.endTime = moment(eventInfo.endTime, 'YYYY-MM-DD').tz(TIME_ZONE_STRING).endOf('day')
      }
      const new_event = await events.create({
        ...eventInfo, // Các trường bao gồm title, description, domainId, nationId, topicId, startTime, endTime
        ownerId: userId,
      });
      // Ghi log
      await logAction(ACTION_TYPE.EVENT_ACTION.CREATE_EVENT, {
        ipAddress: req.ip,
        visible: true,
        ownerId: userId,
        eventId: new_event.eventId,
        description: `Thêm sự kiện "${eventInfo.displayName}" thành công.`,
      });
      return res.send(onSuccess(new_event));
    } catch (error) {
      // await logAction(ACTION_TYPE.EVENT_ACTION.CREATE_EVENT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API sửa thông tin sự kiện
  editEvent: async (req, res) => {
    const { userId } = req.user;
    try {
      const { eventId } = req.params;
      const entity = req.body;
      // Lấy thông tin event từ eventId
      const eventInfo = await events.findOne({
        where: { eventId },
      });
      // Kiểm tra nếu id người tạo trùng với id người chỉnh sửa
      if (eventInfo.ownerId === userId) {
        // Thực hiện cập nhật thông tin event
        // title, description, startTime, endTime, topicId
        // domainId, nationId
        eventInfo.title = entity.title || eventInfo.title;
        eventInfo.andOrKeywords = entity.andOrKeywords || eventInfo.andOrKeywords;
        eventInfo.notKeywords = entity.notKeywords || eventInfo.notKeywords;
        eventInfo.displayName = entity.displayName || eventInfo.displayName;
        eventInfo.description = entity.description || eventInfo.description;
        if (entity.startTime) {
          eventInfo.startTime = moment(entity.startTime, 'YYYY-MM-DD').tz(TIME_ZONE_STRING).startOf('day')
        }
        if (entity.endTime) {
          eventInfo.endTime = moment(entity.endTime, 'YYYY-MM-DD').tz(TIME_ZONE_STRING).endOf('day')
        }
        // eventInfo.startTime = entity.startTime || eventInfo.startTime;
        // eventInfo.endTime = entity.endTime || eventInfo.endTime;
        // Kiểm tra tồn tại của domain theo domainId (nếu có cập nhật)
        if (entity.domainId) {
          const domainInfo = await domain.findOne({
            where: { domainId: entity.domainId },
          });
          // Nếu domainId không tồn taị
          if (!domainInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
            //   ownerId: userId,
            //   eventId: eventId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Lĩnh vực của sự kiện không tồn tại",
            // });
            return res.send(onError(404, "Lĩnh vực không tồn tại"));
          }
          // Cập nhật thêm thông tin domainId
          eventInfo.domainId = entity.domainId;
        }
        // Kiểm tra tồn tại của nation theo nationId (nếu có cập nhật)
        if (entity.nationId) {
          const nationInfo = await nation.findOne({
            where: { nationId: entity.nationId },
          });
          // Nếu domainId không tồn taị
          if (!nationInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
            //   ownerId: userId,
            //   eventId: eventId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Quốc gia của sự kiện không tồn tại",
            // });
            return res.send(onError(404, "Quốc gia không tồn tại"));
          }
          // Cập nhật thêm thông tin nationId
          eventInfo.nationId = entity.nationId;
        }
        // Kiểm tra tồn tại của area theo areaId (nếu có cập nhật)
        if (entity.areaId) {
          const areaInfo = await area.findOne({
            where: { areaId: entity.areaId },
          });
          // Nếu areaId không tồn taị
          if (!areaInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
            //   ownerId: userId,
            //   eventId: eventId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Khu vực của sự kiện không tồn tại",
            // });
            return res.send(onError(404, "Khu vực không tồn tại"));
          }
          // Cập nhật thêm thông tin areaId
          eventInfo.areaId = entity.areaId;
        }
        // Thực hiện cập nhật vào CSDL
        const event_update = await eventInfo.save();
        // Ghi log
        await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
          ownerId: userId,
          eventId: eventId,
          ipAddress: req.ip,
          visible: false,
          description: "Chỉnh sửa thành công chủ đề",
        });
        return res.send(onSuccess(event_update));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
      //   ownerId: userId,
      //   topicId: eventId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Tài khoản không được phép thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      // console.log('error : ',error)
      // await logAction(ACTION_TYPE.EVENT_ACTION.EDIT_EVENT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá sự kiện
  deleteEvent: async (req, res) => {
    const { userId } = req.user;
    try {
      const { eventId } = req.params;
      // Lấy thông tin event từ eventId
      const eventInfo = await events.findOne({
        where: { eventId },
      });
      // Kiểm tra nếu id người tạo event trùng với id người xoá
      if (eventInfo && eventInfo.ownerId === userId) {
        // Cập nhật trạng thái đã bị xoá
        eventInfo.enable = false;
        // Cập nhật thông tin vào CSDL
        await eventInfo.save();
        await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_EVENT, {
          ownerId: userId,
          eventId: eventId,
          ipAddress: req.ip,
          visible: false,
          description: `Xoá sự kiện "${eventInfo.displayName}" thành công`,
        });
        return res.send(onSuccess({}));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_EVENT, {
      //   ownerId: userId,
      //   topicId: eventId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Tài khoản không được phép thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      // await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_EVENT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API chia sẻ sự kiện
  shareEvent: async (req, res) => {
    const { userId } = req.user;
    try {
      var entity = req.body;
      const eventId = entity.eventId;
      // Lấy thông tin event từ eventId
      const eventInfo = await events.findOne({
        where: { eventId },
      });
      const userInfo = await users.findOne({
        where: {
          userId: userId
        }
      });
      // Kiểm tra id của người tạo event có trùng với id của người dùng hay không?
      if (eventInfo.ownerId === userId) {
        if (eventInfo && eventInfo.enable) {
          const listShareUserIds = entity.listShareUserId;
          // Thêm user được chia sẻ event vào bảng shareEvents
          for (let index = 0; index < listShareUserIds.length; index++) {
            const shareUserId = listShareUserIds[index];
            // Không tạo bản ghi chia sẻ với chính user
            if (shareUserId !== eventInfo.ownerId) {
              const inShareEvents = await shareEvents.findOne({
                where: {
                  eventId,
                  shareUserId,
                },
              });
              // Nếu userId chưa được chia sẻ topic hiện tại
              if (!inShareEvents) {
                await shareEvents.create({
                  eventId: eventId,
                  shareUserId: shareUserId,
                  ownerId: eventInfo.ownerId,
                });
              } else {
                if (!inShareEvents.enable) {
                  inShareEvents.enable = true;
                  inShareEvents.createdDate = new Date()
                  await inShareEvents.save();
                }
              }
            }
          }

          // Ghi log
          const eventLog = await logAction(ACTION_TYPE.EVENT_ACTION.SHARE_EVENT, {
            ownerId: userId,
            eventId: eventId,
            ipAddress: req.ip,
            visible: true,
            description: `Chia sẻ sự kiện "${eventInfo.displayName}" thành công`,
          });
          listShareUserIds.forEach(async (id) => {
            const eventContent = {
              userId: id,
              activityLogId: eventLog.id,
              read: false,
              displayName: `"${userInfo.displayName}" đã chia sẻ cho bạn sự kiện"${eventInfo.displayName}"`
            }
            await notification.create(eventContent);
            sendNotificationToUser(
              id,
              NotificationType.NOTIFICATION_SHARE_EVENT,
              `"${userInfo.displayName}" đã chia sẻ cho bạn sự kiện "${eventInfo.displayName}"`
            )
          })
          return res.send(onSuccess({ content: `"${userInfo.displayName}" đã chia sẻ cho bạn sự kiện "${eventInfo.displayName}"` }));
        }
        // Kiểm tra event có tồn tại hay không?
        // if (eventInfo && eventInfo.enable) {
        //   const listShareUserIds = entity.listShareUserId;
        //   // Thêm user được chia sẻ event vào bảng shareEvents
        //   listShareUserIds.forEach(async (shareUserId) => {
        //     const inShareEvents = await shareEvents.findOne({
        //       where: { eventId, shareUserId },
        //     });
        //     // Nếu userId chưa được chia sẻ event hiện tại
        //     if (!inShareEvents) {
        //       await shareEvents.create({
        //         ...entity,
        //         shareUserId: shareUserId,
        //         ownerId: eventInfo.ownerId,
        //         enable: true,
        //       });
        //       // Ghi log
        //       await logAction(ACTION_TYPE.SHARE, {
        //         ownerId: userId,
        //         shareUserId: shareUserId,
        //         eventId: eventId,
        //         description: "Chia sẻ sự kiện thành công",
        //       });
        //     }
        //   });
        //   return res.send(onSuccess({}));
        // }
        // Ghi log
        // await logAction(ACTION_TYPE.EVENT_ACTION.SHARE_EVENT, {
        //   ownerId: userId,
        //   eventId: eventId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: "Chia sẻ không thành công do chủ đề không tồn tại",
        // });
        return res.send(onError(404, "Đối tượng khồng tồn tại"));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.EVENT_ACTION.SHARE_EVENT, {
      //   ownerId: userId,
      //   eventId: eventId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: "Tài khoản không có quyền",
      // });
      return res.send(onError(403, "Tài khoản không có quyền"));
    } catch (error) {
      // await logAction(ACTION_TYPE.EVENT_ACTION.SHARE_EVENT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá chia sẻ
  deleteShareEvent: async (req, res) => {
    const { userId } = req.user;
    try {
      const { eventId, shareUserId } = req.body;
      //Lấy thông tin event từ eventId
      const eventInfo = await events.findOne({
        where: { eventId },
      });
      const ownerId = eventInfo.ownerId;
      if (userId === ownerId) {
        const shareEvent = await shareEvents.findOne({
          where: { eventId, shareUserId, ownerId },
        });
        if (shareEvent) {
          //Cập nhật trạng thái đã bị xoá
          shareEvent.enable = false;
          await shareEvent.save();
          await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_SHARE_EVENT, {
            ownerId: userId,
            eventId: eventId,
            ipAddress: req.ip,
            visible: false,
            description: `Xoá chia sẻ sự kiện "${eventInfo.displayName}" thành công`,
          });
          return res.send(onSuccess({}));
        }
      }
      // Ghi log
      // await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_SHARE_EVENT, {
      //   ownerId: userId,
      //   eventId: eventId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Tài khoản không được phép thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không được phép thực hiện"));
    } catch (error) {
      // await logAction(ACTION_TYPE.EVENT_ACTION.REMOVE_SHARE_EVENT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách sự kiện
  getListEvent: async (req, res) => {
    try {
      const { userId } = req.user;
      const pagination = req.pagination;
      const {
        owner = true,
        inEventId,
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
        nationId,
        domainId,
        areaId,
      } = req.query;
      const ownerQuery = JSON.parse(owner);
      const domainQuery =
        domainId !== undefined
          ? {
            domainId: JSON.parse(domainId),
          }
          : {};
      const nationQuery =
        nationId !== undefined
          ? {
            nationId: JSON.parse(nationId),
          }
          : {};
      const areaQuery =
        areaId !== undefined
          ? {
            areaId: JSON.parse(areaId),
          }
          : {};
      const filterParams = {
        ...nationQuery,
        ...domainQuery,
        ...areaQuery,
      }
      var _filter = {};
      // Khởi tạo bộ lọc với offset và limit
      var filter = {
        offset: pagination.offset,
        limit: pagination.limit,
        order: [["createdDate", "DESC"]],
      };
      if (inEventId) {
        _filter = {
          ..._filter,
          ...filterParams,
          eventId: inEventId,
        };
      }
      if (ownerQuery) {
        // Lấy danh sách sự kiện mà userId tạo ra
        filter = {
          ...filter,
          ...{
            where: {
              ..._filter,
              ...filterParams,
              ownerId: userId,
              enable: true,
            },
            distinct: true,
            include: [
              {
                model: shareEvents,
                as: "shareEvents",
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
                model: domain, // Lĩnh vực
                as: "domain",
                // Chỉ lấy các thuộc tính
                attributes: ["domainId", "displayName"],
              },
              {
                model: users, // Chủ sở hữu
                as: "owner",
                // Chỉ lấy các thuộc tính
                attributes: ["userId", "displayName", "avatar"],
              },
              {
                model: nation, // Quốc gia
                as: "nation",
                // Chỉ lấy các thuộc tính
                attributes: ["nationId", "displayName"],
              },
              {
                model: area, // Khu vực
                as: "area",
                // Chỉ lấy các thuộc tính
                attributes: ["areaId", "displayName"],
              }
            ]
          },
        };
        // console.log(filter)
        const { count, rows } = await events.findAndCountAll(filter);
        const results = rows.map((e) => {
          return onDataEventFormat(e);
        });
        // await logAction(ACTION_TYPE.GET, {
        //   description: "Lấy danh sách sự kiện thành công",
        // });
        return res.send(onSuccess({
          listEvents: results,
          pageSize: parseInt(pageSize),
          pageIndex: parseInt(pageIndex),
          count,
        }));
        // let data = await events.findAll(filter);
        // count là tổng số bản ghi thoả mãn điều kiện của bộ lọc chứ không phải số bản ghi em lấy được
        // data["count"] = data.length;
        // result = [...result, ...data];
      } else {
        // Lấy danh sách sự kiện mà userId được chia sẻ trong shareEvent
        filter = {
          ...filter,
          ...{
            //chỉ lấy các thuộc tính
            // attributes: ["eventId", "owner"],
            where: {
              ..._filter,
              shareUserId: userId,
              enable: true,
            },
            distinct: true,
            include: {
              model: events,
              as: "event",
              where: {
                ...filterParams,
              },
              include: [
                {
                  model: shareEvents,
                  as: "shareEvents",
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
                },
                {
                  model: nation, // Quốc gia
                  as: "nation",
                  // Chỉ lấy các thuộc tính
                  attributes: ["nationId", "displayName"],
                },
                {
                  model: area, // Khu vực
                  as: "area",
                  // Chỉ lấy các thuộc tính
                  attributes: ["areaId", "displayName"],
                }
              ]
            },
          },
        };
        // let data = await shareEvents.findAll(filter);
        // // count là tổng số bản ghi thoả mãn điều kiện của bộ lọc chứ không phải số bản ghi em lấy dc
        // data["count"] = data.length;
        // result = [...result, ...data];
        // let data = await shareTopics.findAll(filter);
        const { count, rows } = await shareEvents.findAndCountAll(filter);
        const results = rows.map((e) => {
          return onDataEventShareFormat(e);
        });
        // await logAction(ACTION_TYPE.GET, {
        //   description: "Lấy danh sách sự kiện thành công",
        // });
        return res.send(onSuccess({
          listEvents: results,
          pageSize: parseInt(pageSize),
          pageIndex: parseInt(pageIndex),
          count,
        }));
      }
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
};
