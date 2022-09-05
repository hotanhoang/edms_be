const {
  onError,
  onSuccess,
  hashesID,
  getToken,
  onDataUserFormat,
  onDataUserShareFormat,
  onDataUserShareTopicFormat
} = require("../utils/utils");
const {
  users,
  group,
  position,
  role,
  documents,
  sumaryConf,
  shareDocuments,
  permisionDocument,
  topic, shareTopics, events, shareEvents, aiConfig
} = require("../models/init-models");
const fs = require("fs");
const { Op, where, fn, col } = require("sequelize");
const jsonwebtoken = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const sha256 = require("sha256");
const {
  SALT,
  ROLE_TYPES,
  ACTION_TYPE,
  EXPIRES_IN,
  JWT_SECRET_KEY_REFRESH,
  CAPACITY,
  PAGINATION_CONSTANTS,
  USER_UPLOAD_DOCS,
  TIME_ZONE
} = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
module.exports = {
  // API đăng nhập hệ thống
  // Note : Can lam ro thi khoi tao document thi khoi tao truong du lieu nao
  logIn: async (req, res) => {
    try {
      const { username, password } = req.body;
      // const userInfo = await users.findOne({
      //   // attributes: {
      //   //   exclude: ["userId", "displayName", "createdDate", "roleId"],
      //   // },
      //   attributes: [
      //     "userId",
      //     "displayName",
      //     "createdDate",
      //     "roleId",
      //     "groupId",
      //     "posId",
      //   ],
      //   where: { username },
      // });

      // Lấy thông tin user
      const userInfo = await users.findOne({
        where: { username },
        include: [
          {
            model: position,
            as: "po",
          },
          {
            model: group,
            as: "group_group",
          },
        ],
      });
      // Kiểm tra xem tài khoản có tồn tại hay không?
      if (userInfo && userInfo.enable) {
        // Kiểm tra xem tài khoản có bị khoá không?
        const isoDateTime = new Date(new Date().getTime() + TIME_ZONE * 60000);
        if (userInfo.timeUnlock && userInfo.timeUnlock > isoDateTime) {
          await logAction(ACTION_TYPE.USER_ACTION.LOGIN, {
            ownerId: userInfo.userId,
            ipAddress: req.ip,
            visible: true,
            description: `Tài khoản '${userInfo.displayName}' bị tạm khoá`,
          });
          return res.send(onError(420, "Tài khoản bị tạm khoá", {}));
        }
        // Nếu không bị khoá thì kiểm tra xem mật khẩu có đúng không?
        if (userInfo.password === sha256(password + SALT)) {
          // Kiểm tra xem có phải user và lần đầu đăng nhập hay không?
          if (userInfo.roleId !== ROLE_TYPES.ADMIN) {
            if (userInfo.initUser) {
              // Thêm mới thư mục root cho user
              // const timestamp = Math.floor(new Date().getTime() / 1000);
              const documentId = hashesID(username);
              const documentRoot = await documents.create({
                documentId,
                inheritDirectoryId: [],
                ownerId: userInfo.userId,
                directory: true,
              });
              userInfo.rootDocument = documentRoot.documentId;
            } else {
              // Tìm thông tin thư mục root
              const documentRoot = await documents.findOne({
                where: {
                  ownerId: userInfo.userId,
                  parentDirectoryId: null,
                  enable: true,
                  recycleBin: false,
                },
              });
              userInfo.rootDocument = documentRoot.documentId;
            }
            // Tao thu muc luu tru cac document cua userId (neu chua ton tai)
            if (!fs.existsSync(`./${USER_UPLOAD_DOCS}/${userInfo.userId}`)) {
              fs.mkdirSync(`./${USER_UPLOAD_DOCS}/${userInfo.userId}`);
            }
          }
          userInfo.initUser = false;
          // Cập nhật thời điểm truy cập
          // Reset số lần đăng nhập sai về 0
          userInfo.lastAccess = new Date();
          userInfo.countLoginFail = 0;
          await userInfo.save();
          // Tạo accessToken
          const accessToken = getToken(
            {
              userId: userInfo.userId,
              roleId: userInfo.roleId,
              // groupId: userInfo.groupId,
              // posId: userInfo.posId,
            },
            EXPIRES_IN
          );
          // Tạo refreshToken
          const refreshToken = getToken({
            userId: userInfo.userId,
            roleId: userInfo.roleId,
            // groupId: userInfo.groupId,
            // posId: userInfo.posId,
          });
          // Ghi log
          await logAction(ACTION_TYPE.USER_ACTION.LOGIN, {
            ownerId: userInfo.userId,
            ipAddress: req.ip,
            visible: true,
            description: `Từ địa chỉ IP: ${req.ip}`,
          });
          return res.send(
            onSuccess({
              accessToken,
              refreshToken,
              userInfo: {
                userId: userInfo.userId,
                username: userInfo.username,
                displayName: userInfo.displayName,
                roleId: userInfo.roleId,
                groupId: userInfo.group_group?.groupId,
                posId: userInfo.po?.posId,
                phone: userInfo.phone,
                email: userInfo.email,
                avatar: userInfo.avatar,
                birthday: userInfo.birthday,
                changePass: userInfo.changePass,
                rootDocumentId: userInfo.rootDocument,
                capacity: userInfo.capacity / 1000000,
                usageStorage: userInfo.usageStorage / 1000000,
              },
            })
          );
        }
        // Nếu nhập mật khẩu sai thì kiểm tra xem số lần nhập sai mật khẩu đã quá 3 lần chưa?
        if (userInfo.countLoginFail >= 3) {
          // Cập nhật trạng thái tài khoản bị khoá (thời gian gia hạn khoá là 5p)
          userInfo.timeUnlock = new Date(new Date().valueOf() + 300 * 1000);
          await userInfo.save();
          await logAction(ACTION_TYPE.USER_ACTION.LOGIN, {
            ownerId: userInfo.userId,
            ipAddress: req.ip,
            visible: true,
            description: `Tài khoản '${userInfo.displayName}' bị tạm khoá`,
          });
          return res.send(onError(420, "Tài khoản bị tạm khoá"));
        }
        // Cập nhật số lần đăng nhập sai
        const incrementResult = await userInfo.increment("countLoginFail");
        // await logAction(ACTION_TYPE.USER_ACTION.LOGIN, {
        //   ownerId: userInfo.userId,
        //   ipAddress: req.ip,
        //   visible: false,
        //   description: "Mật khẩu nhập không đúng",
        // });
        return res.send(
          onError(419, "Mật khẩu nhập không đúng", {
            countLoginFail: incrementResult.countLoginFail,
          })
        );
      }
      return res.send(onError(404, "Tài khoản không tồn tại"));
    } catch (error) {
      // await logAction(ACTION_TYPE.USER_ACTION.LOGIN, {
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách người dùng/ chi tiết người dùng
  getListUser: async (req, res) => {
    try {
      const { roleId, userId } = req.user;
      const pagination = req.pagination;
      const {
        userID,
        name,
        groupId,
        posId,
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
        status,
      } = req.query;
      // console.log("ACTION TYPE > ", Object.values(ACTION_TYPE.USER_ACTION))
      // Kiểm tra groupId, posId có tồn tại không?
      if (posId) {
        const posInfo = await position.findOne({
          where: { posId: posId },
        });
        if (!posInfo)
          return res.send(onError(500, `posId=${posId} không tồn tại.`));
      }
      if (groupId) {
        const groupInfo = await group.findOne({
          where: { groupId: groupId },
        });
        if (!groupInfo)
          return res.send(onError(500, `groupId=${groupId} không tồn tại`));
      }
      const groupQuery =
        groupId !== ""
          ? {
            groupId: JSON.parse(groupId),
          }
          : {};
      const posQuery =
        posId !== ""
          ? {
            posId: JSON.parse(posId),
          }
          : {};
      const statusQuery =
        status !== ""
          ? JSON.parse(status)
            ? {
              enable: true,
              countLoginFail: 0,
            }
            : {
              [Op.or]: [
                {
                  enable: false,
                },
                {
                  countLoginFail: {
                    [Op.gte]: 3,
                  },
                },
              ],
            }
          : {};
      // Nếu lấy dữ liệu theo tên người dùng
      if (name) {
        // Trả về danh sách người dùng theo tên gần giống với đầu vào
        const { count, rows } = await users.findAndCountAll({
          attributes: {
            // include: [[fn("LOWER", col("displayName")), "lowerName"]],
            exclude: ["password", "timeUnlock"],
          },
          where: {
            displayName: where(
              fn("LOWER", col("users.displayName")),
              "LIKE",
              "%" + name.toLowerCase() + "%"
            ),
            ...groupQuery,
            ...posQuery,
            ...statusQuery,
          },
          offset: pagination.offset,
          limit: pagination.limit,
          order: [["createdDate", "DESC"]],
          include: [
            {
              model: position,
              as: "po",
            },
            {
              model: group,
              as: "group_group",
            },
          ],
        });
        // await logAction(ACTION_TYPE.GET, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   description: "Lấy danh sách người dùng theo tên thành công",
        // });
        const results = rows.map((e) => {
          return onDataUserFormat(e);
        });
        return res.send(
          onSuccess({
            listUser: results,
            pageSize: parseInt(pageSize),
            pageIndex: parseInt(pageIndex),
            count,
          })
        );
      } else {
        // Lấy thông tin chi tiết của người dùng
        if (userID === userId) {
          const userInfo = await users.findOne({
            attributes: {
              exclude: ["password", "timeUnlock"],
            },
            where: {
              userId,
            },
            include: [
              {
                model: position,
                as: "po",
              },
              {
                model: group,
                as: "group_group",
              },
            ],
          });
          // Lấy thông tin thư mục document root của user (Nếu quyền là user)
          let rootDocumentId = ""
          if (userInfo.roleId === ROLE_TYPES.USER) {
            const documentInfo = await documents.findOne({
              where: {
                ownerId: userId,
                parentDirectoryId: null,
                directory: true,
                enable: true,
                recycleBin: false
              },
            });
            rootDocumentId = documentInfo.documentId
          }
          // await logAction(ACTION_TYPE.GET, {
          //   ownerId: userId,
          //   description: "Lấy thông tin người dùng thành công",
          // });
          return res.send(onSuccess({
            ...onDataUserFormat(userInfo),
            rootDocumentId
          }));
        } else {
          let filter = {
            // Lấy tất cả thuộc tính trừ password, enable, countLoginFail, timeUnlock
            attributes: {
              exclude: ["password", "timeUnlock"],
            },
            where: {
              ...groupQuery,
              ...posQuery,
              ...statusQuery,
            },
            include: [
              {
                model: position,
                as: "po",
              },
              {
                model: group,
                as: "group_group",
              },
            ],
            offset: pagination.offset,
            limit: pagination.limit,
            order: [["createdDate", "DESC"]],
          };
          // Kiểm tra xem user có quyền admin không?
          if (roleId === ROLE_TYPES.ADMIN) {
            // lấy thông tin phân trang được set trong request ở midware
            filter = {
              ...filter,
              attributes: {
                exclude: ["password", "timeUnlock"],
              },
            };
          } else {
            filter = {
              ...filter,
              // Chỉ lấy các thuộc tính
              attributes: ["userId", "displayName", "groupId", "posId"],
            };
          }
          const { count, rows } = await users.findAndCountAll(filter);
          // await logAction(ACTION_TYPE.GET, {
          //   ownerId: userId,
          //   description: "Lấy danh sách người dùng thành công",
          // });

          const results = rows.map((e) => {
            return onDataUserFormat(e);
          });
          return res.send(
            onSuccess({
              listUser: results,
              pageSize: parseInt(pageSize),
              pageIndex: parseInt(pageIndex),
              count,
            })
          );
        }
      }
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API đăng xuất hệ thống
  logOut: async (req, res) => {
    const { userId } = req.user;
    try {
      // Ghi log hoạt động đăng xuất
      await logAction(ACTION_TYPE.USER_ACTION.LOGOUT, {
        ownerId: userId,
        ipAddress: req.ip,
        visible: true,
        description: "Đăng xuất khỏi hệ thống",
      });
      return res.send(onSuccess({}));
    } catch (error) {
      // await logAction(ACTION_TYPE.USER_ACTION.LOGOUT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API thêm mới người dùng
  // Note : Them typeId la fk cua typeId trong table typeDocSumary
  addUser: async (req, res) => {
    const { roleId, userId } = req.user;
    try {
      const { username, password, groupId, posId } = req.body;
      // Kiểm tra xem user có quyền admin hay không?
      if (roleId === ROLE_TYPES.ADMIN) {
        // Kiểm tra xem username này đã tồn tại hay chưa?
        const findUser = await users.findOne({
          where: { username },
        });
        if (!findUser) {
          const userID = hashesID(username);
          // Kiểm tra xem groupId có tồn tại
          const groupInfo = await group.findOne({
            where: {
              groupId,
            },
          });
          if (!groupInfo) {
            // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mã groupId không tồn tại",
            // });
            return res.send(onError(404, "Mã groupId không tồn tại"));
          }
          // Kiểm tra xem posId có tồn tại
          const posInfo = await position.findOne({
            where: {
              posId,
            },
          });
          if (!posInfo) {
            // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mã posId không tồn tại",
            // });
            return res.send(onError(404, "Mã posId không tồn tại"));
          }
          // Đếm số posId nằm trong vùng giới hạn (limit = posInfo.limit) khi cùng groupId
          const countPosbyGroup = await users.count({
            where: {
              posId, groupId
            }
          });
          if (countPosbyGroup >= posInfo.limit) {
            // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Số posId trong groupId vượt quá giới hạn cho phép",
            // });
            return res.send(onError(413, "Số posId trong groupId vượt quá giới hạn cho phép"));
          }
          // Kiểm tra xem roleId có tồn tại
          const roleInfo = await role.findOne({
            where: {
              roleId: req.body.roleId,
            },
          });
          if (!roleInfo) {
            // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mã roleId không tồn tại",
            // });
            return res.send(onError(404, "Mã roleId không tồn tại"));
          }
          // Tạo mới user
          const new_user = await users.create({
            ...req.body,
            userId: userID,
            capacity: req.body.capacity || CAPACITY,
            password: sha256(password + SALT), // hash password (bcrypt.hashSync(password, 16))
          });
          if (new_user) {
            // Lấy cấu hình tóm tắt văn bản của userId
            const sumaryConfDefault = await aiConfig.findAll({
              where: { userId },
            });
            // Khởi tạo cấu hình tóm tắt văn bản cho user vừa tạo (lấy mặc định theo cấu hình của admin tạo user)
            let listConfig = []
            sumaryConfDefault.forEach(e => {
              listConfig.push({
                userId: new_user.userId,
                default: true,
                updateTime: new Date(),
                mapAlgTypeAIId: e.mapAlgTypeAIId,
                longSum: e.longSum
              })
            });
            await aiConfig.bulkCreate(listConfig);
            await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
              ownerId: userId,
              ipAddress: req.ip,
              visible: false,
              description: "Thêm mới người dùng thành công",
            });
            const { id, ...userInfo } = new_user;
            return res.send(
              onSuccess({
                userId: new_user.userId,
                username: new_user.username,
                displayName: new_user.displayName,
                createdDate: new_user.createdDate,
                roleId: new_user.roleId,
                groupId: new_user.groupId,
                posId: new_user.posId,
                phone: new_user.phone,
                email: new_user.email,
                avatar: new_user.avatar,
                birthday: new_user.birthday,
              })
            );
          }
        } else {
          // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
          //   ownerId: userId,
          //   ipAddress: req.ip,
          //   visible: false,
          //   description: "Thêm mới không thành công do người dùng đã tồn tại",
          // });
          return res.send(onError(418, "Người dùng này đã tồn tại"));
        }
      } else {
        // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: false,
        //   description: "Không có quyền thực hiện",
        // });
        return res.send(onError(403, "Bạn không có quyền thực hiện"));
      }
    } catch (error) {
      // await logAction(ACTION_TYPE.USER_ACTION.CREATE_ACCOUNT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API sửa thông tin người dùng
  editUserInfo: async (req, res) => {
    const { roleId, userId } = req.user;
    try {
      const { userID } = req.params;
      const entity = req.body;
      // Truy vấn thông tin của user theo userID
      const userInfo = await users.findOne({
        where: { userId: userID },
      });
      // Nếu là sửa thông tin cho chính user/admin đó(user chỉ được quyền thay đổi mật khẩu)
      if (userID === userId) {
        // Xác thực lại mật khẩu cũ
        if (entity.oldPassword) {
          if (sha256(entity.oldPassword + SALT) !== userInfo.password) {
            // await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mật khẩu cũ không đúng",
            // });
            return res.send(onError(419, "Mật khẩu cũ không đúng"));
          }
          // Cập nhật mật khẩu mới cho chính user đó
          userInfo.password = sha256(entity.password + SALT);
          // Cập nhật trạng thái đã thay đổi mật khẩu
          userInfo.changePass = false;
        }
      }
      if (roleId === ROLE_TYPES.ADMIN) {
        userInfo.displayName = entity.displayName || userInfo.displayName; // Tên hiển thị
        if (entity.groupId) {
          // Kiểm tra xem groupId có tồn tại
          const groupInfo = await group.findOne({
            where: {
              groupId: entity.groupId,
            },
          });
          if (!groupInfo) {
            // await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mã groupId không tồn tại",
            // });
            return res.send(onError(404, "Mã groupId không tồn tại"));
          }
          userInfo.groupId = entity.groupId; // Cập nhật thông tin groupId
        }
        if (entity.posId) {
          // Kiểm tra xem posId có tồn tại
          const posInfo = await position.findOne({
            where: {
              posId: entity.posId,
            },
          });
          if (!posInfo) {
            // await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Mã posId không tồn tại",
            // });
            return res.send(onError(404, "Mã posId không tồn tại"));
          }
          const countPosbyGroup = await users.count({
            where: {
              posId: entity.posId,
              groupId: userInfo.groupId
            }
          });
          // Kiểm tra giới hạn vị trí trong phòng
          if (countPosbyGroup >= posInfo.limit) {
            // await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Số posId trong groupId vượt quá giới hạn cho phép",
            // });
            return res.send(onError(413, "Số posId trong groupId vượt quá giới hạn cho phép"));
          }
          userInfo.posId = entity.posId; // Cập nhật thông tin posId
        }
        if (entity.capacity && entity.capacity > userInfo.usageStorage) {
          // Cập nhật lại giới hạn sử dụng
          userInfo.capacity = entity.capacity;
        }
        if (entity.password) {
          // Cập nhật mật khẩu mới cho userId
          userInfo.password = sha256(entity.password + SALT);
          // Cập nhật trạng thái yêu cầu người dùng đổi mật khẩu nếu user đó không phải chính mình
          if (userID !== userId) {
            userInfo.changePass = true;
          }
        }
        // Trường hợp mở khoá cho người dùng
        if (entity.enable === true) {
          // Cập nhật lại trạng thái và số lần login sai về mặc định
          userInfo.enable = true;
          userInfo.countLoginFail = 0;
          userInfo.timeUnlock = new Date();
        } else if (entity.enable === false) {
          // Cập nhật lại trạng thái và số lần login sai về mặc định
          userInfo.enable = false;
        }
      }
      // Cập nhật các thông tin còn lại

      // console.log('entity.email : ', entity.email)
      // console.log('entity.phone : ', entity.phone)
      // console.log('entity.birthday : ', entity.birthday)

      userInfo.email = entity.email  // || userInfo.email;
      userInfo.phone = entity.phone // || userInfo.phone;
      userInfo.birthday = entity.birthday // || userInfo.birthday;
      userInfo.avatar = entity.avatar || userInfo.avatar;
      // Thực hiện cập nhật các thông tin
      const userUpdate = await userInfo.save();
      await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
        ownerId: userId,
        ipAddress: req.ip,
        visible: false,
        description: "Chỉnh sửa thông tin thành công",
      });
      return res.send(
        onSuccess({
          userId: userUpdate.userId,
          phone: userInfo.phone,
          email: userInfo.email,
          avatar: userInfo.avatar,
          birthday: userInfo.birthday,
          changePass: userInfo.changePass,
        })
      );
    } catch (error) {
      // await logAction(ACTION_TYPE.USER_ACTION.EDIT_ACCOUNT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá một người dùng nào đó
  removeUser: async (req, res) => {
    const { roleId, userId } = req.user;
    try {
      const { userID } = req.params;

      // Không cần kiểm tra user_id hay chưa.
      // Mà cần lấy thông tin userID và cập nhật trạng thái enable = false

      // Kiểm tra xem user_id này đã tồn tại hay chưa?
      // const current_user = await users.findOne({
      //   where: { userId: userId },
      // });

      // Đầu tiên check quyền trước
      if (roleId === ROLE_TYPES.ADMIN) {
        // Lấy thông tin của user cần xoá
        const current_user = await users.findOne({
          where: { userId: userID },
        });
        // let id = req.params.userID;
        if (!current_user) {
          // await logAction(ACTION_TYPE.USER_ACTION.REMOVE_ACCOUNT, {
          //   ownerId: userId,
          //   ipAddress: req.ip,
          //   visible: false,
          //   description: "Xoá không thành công do người dùng không tồn tại",
          // });
          return res.send(onError(404, "Tài khoản không tồn tại"));
        }
        // Cập nhật trạng thái đã bị xoá
        current_user.enable = false;
        await current_user.save();
        await logAction(ACTION_TYPE.USER_ACTION.REMOVE_ACCOUNT, {
          ownerId: userId,
          ipAddress: req.ip,
          visible: false,
          description: "Xoá người dùng thành công",
        });
        return res.send(onSuccess({}));
      }
      // await logAction(ACTION_TYPE.USER_ACTION.REMOVE_ACCOUNT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "Bạn không có quyền thực hiện",
      // });
      return res.send(onError(403, "Tài khoản không có quyền"));
    } catch (error) {
      // await logAction(ACTION_TYPE.USER_ACTION.REMOVE_ACCOUNT, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API cấp lại accessToken
  onRefreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        // Xác thực refreshToken
        jsonwebtoken.verify(
          refreshToken,
          JWT_SECRET_KEY_REFRESH,
          async function (err, user) {
            if (err) {
              return res.send(onError(401, "Refresh Token Invalid"));
            } else {
              // Tạo accessToken
              const accessToken = getToken(
                {
                  userId: user.userId,
                  roleId: user.roleId,
                },
                EXPIRES_IN
              );
              // await logAction(ACTION_TYPE.GET, {
              //   ownerId: user.userId,
              //   description: "Cấp lại access token thành công",
              // });
              return res.send(onSuccess({ accessToken }));
            }
          }
        );
      } else {
        return res.send(onError(401, "Refresh Token Invalid"));
      }
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách quyền người dùng
  getListRole: async (req, res) => {
    try {
      const { roleId } = req.user;
      // Kiểm tra quyền của người dùng khi lấy danh sách
      if (roleId === ROLE_TYPES.ADMIN) {
        const result = await role.findAll({
          where: {
            enable: true,
          },
        });
        return res.send(onSuccess(result));
      }
      return res.send(onError(403, "Bạn không có quyền thực hiện"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách người dùng để chia sẻ văn bản
  getListUserShare: async (req, res) => {
    try {
      const { userId } = req.user;
      const {
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
      } = req.query;
      const pagination = req.pagination;
      const userInfo = await users.findOne({
        where: {
          userId, enable: true
        },
        include: [
          {
            model: position,
            as: "po",
          },
          {
            model: group,
            as: "group_group",
          },
        ],
      })
      if (userInfo) {
        let filter = {
          [Op.or]: [
            {
              '$group_group.groupId$': userInfo.groupId,
            },
            {
              '$group_group.parentGroupId$': userInfo.groupId,
            },
            {
              '$group_group.groupId$': userInfo.group_group.parentGroupId,
            }
          ]
        }
        if (userInfo.po.crossGroup) {
          filter = {
            [Op.or]:
              [
                {
                  '$group_group.groupId$': userInfo.groupId,
                },
                {
                  '$group_group.parentGroupId$': userInfo.groupId,
                },
                {
                  '$group_group.groupId$': userInfo.group_group.parentGroupId,
                },
                {
                  '$po.rolePosId$': userInfo.po.rolePosId
                }
              ]
          }
        }
        const listUser = await users.findAll({
          include: [{
            model: group,
            as: "group_group",
          },
          {
            model: position,
            as: "po",
          }],
          where: {
            roleId: ROLE_TYPES.USER,
            userId: {
              [Op.ne]: userId
            },
            ...filter
          },
          offset: pagination.offset,
          limit: pagination.limit,
        })
        const results = listUser.map((e) => {
          return onDataUserShareFormat(e);
        });
        return res.send(onSuccess(results));
      }
      // await logAction(ACTION_TYPE.GET, {
      //   ownerId: userId,
      //   description: "Không có quyền thực hiện",
      // });
      return res.send(onError(404, "Bạn không có quyền thực hiện"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách người dùng được chia sẻ với documentId
  getUserShareDocs: async (req, res) => {
    try {
      // Chủ sở hữu hoặc người được chia sẻ mới có quyền lấy thông tin
      const { userId } = req.user;
      const pagination = req.pagination;
      const { documentId } = req.params;
      // Lấy thông tin document theo documentId và ownerId = userId
      const documentInfo = await documents.findOne({
        where: {
          ownerId: userId,
          documentId: documentId,
          enable: true,
          recycleBin: false
        },
      })
      if (!documentInfo) {
        // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
        const docShareUserId = await shareDocuments.findOne({
          where: {
            shareUserId: userId,
            documentId: documentId,
            enable: true,
          },
        });
        if (!docShareUserId) {
          // await logAction(ACTION_TYPE.EDIT, {
          //   ownerId: userId,
          //   description: "Tài khoản không được phép thực hiện",
          // });
          return res.send(
            onError(403, "Tài khoản không được phép thực hiện")
          );
        }
      }
      const listUser = await shareDocuments.findAll({
        where: { documentId, enable: true },
        offset: pagination.offset,
        limit: pagination.limit,
        include: [
          {
            model: users,
            as: "shareUser",
          },
          {
            model: permisionDocument,
            as: "permission",
          }
        ],
      });
      const results = listUser.map((e) => {
        return {
          userId: e.shareUser.userId,
          displayName: e.shareUser.displayName,
          avatar: e.shareUser.avatar,
          permissionId: e.permission.permissionId,
          permissionDisplayName: e.permission.displayName,
        }
      });
      return res.send(onSuccess(results));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách người dùng được chia sẻ với topicId mà userId được phép xem
  getUserShareTopic: async (req, res) => {
    try {
      // Chủ sở hữu hoặc người được chia sẻ mới có quyền lấy thông tin
      const { userId } = req.user;
      const pagination = req.pagination;
      const { topicId } = req.params;
      // Lấy thông tin topic theo topicId và userId
      const topicInfo = await topic.findOne({
        where: {
          ownerId: userId,
          topicId: topicId,
          enable: true,
        },
      })
      if (!topicInfo) {
        // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
        const topicShareUserId = await shareDocuments.findOne({
          where: {
            shareUserId: userId,
            topicId: topicId,
            enable: true,
          },
        });
        if (!topicShareUserId) {
          // await logAction(ACTION_TYPE.EDIT, {
          //   ownerId: userId,
          //   description: "Tài khoản không được phép thực hiện",
          // });
          return res.send(
            onError(403, "Tài khoản không được phép thực hiện")
          );
        }
      }
      // Lấy danh sách người dùng mà userId được phép chia sẻ (Chủ đề, sự kiện, văn bản)
      const userInfo = await users.findOne({
        where: {
          userId, enable: true
        },
        include: [
          {
            model: position,
            as: "po",
          },
          {
            model: group,
            as: "group_group",
          },
        ],
      })
      if (userInfo) {
        let filter = {
          [Op.or]: [
            {
              '$group_group.groupId$': userInfo.groupId,
            },
            {
              '$group_group.parentGroupId$': userInfo.groupId,
            },
            {
              '$group_group.groupId$': userInfo.group_group.parentGroupId,
            }
          ]
        }
        if (userInfo.po.crossGroup) {
          filter = {
            [Op.or]:
              [
                {
                  '$group_group.groupId$': userInfo.groupId,
                },
                {
                  '$group_group.parentGroupId$': userInfo.groupId,
                },
                {
                  '$group_group.groupId$': userInfo.group_group.parentGroupId,
                },
                {
                  '$po.rolePosId$': userInfo.po.rolePosId
                }
              ]
          }
        }
        const listUser = await users.findAll({
          include: [{
            model: group,
            as: "group_group",
          },
          {
            model: position,
            as: "po",
          }],
          where: {
            roleId: ROLE_TYPES.USER,
            userId: {
              [Op.ne]: userId
            },
            ...filter
          },
        })
        const listUserIds = listUser.map(e => e.userId)
        // console.log('listUserIds : ', listUserIds)
        const listUserShare = await shareTopics.findAll({
          where: {
            topicId,
            shareUserId: {
              [Op.in]: listUserIds,
            },
            enable: true
          },
          offset: pagination.offset,
          limit: pagination.limit,
          include: [
            {
              model: users,
              as: "shareUser",
            }
          ],
        });
        const results = listUserShare.map((e) => {
          return onDataUserShareTopicFormat(e);
        });
        return res.send(onSuccess(results));
      }
      // await logAction(ACTION_TYPE.GET, {
      //   ownerId: userId,
      //   description: "Tài khoản không tồn tại",
      // });
      return res.send(
        onError(404, "Tài khoản không tồn tại")
      );
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách người dùng được chia sẻ với eventId mà userId được phép xem
  getUserShareEvent: async (req, res) => {
    try {
      // Chủ sở hữu hoặc người được chia sẻ mới có quyền lấy thông tin
      const { userId } = req.user;
      const pagination = req.pagination;
      const { eventId } = req.params;
      // Lấy thông tin event theo eventId và userId
      const eventInfo = await events.findOne({
        where: {
          ownerId: userId,
          eventId: eventId,
          enable: true,
        },
      })
      if (!eventInfo) {
        // Nếu không phải chủ sở hữu thì kiểm tra xem được chia sẻ hay không?
        const eventShareUserId = await shareEvents.findOne({
          where: {
            shareUserId: userId,
            eventId: eventId,
            enable: true,
          },
        });
        if (!eventShareUserId) {
          // await logAction(ACTION_TYPE.EDIT, {
          //   ownerId: userId,
          //   description: "Tài khoản không được phép thực hiện",
          // });
          return res.send(
            onError(403, "Tài khoản không được phép thực hiện")
          );
        }
      }
      // Lấy danh sách người dùng mà userId được phép chia sẻ (Chủ đề, sự kiện, văn bản)
      const userInfo = await users.findOne({
        where: {
          userId, enable: true
        },
        include: [
          {
            model: position,
            as: "po",
          },
          {
            model: group,
            as: "group_group",
          },
        ],
      })
      if (userInfo) {
        let filter = {
          [Op.or]: [
            {
              '$group_group.groupId$': userInfo.groupId,
            },
            {
              '$group_group.parentGroupId$': userInfo.groupId,
            },
            {
              '$group_group.groupId$': userInfo.group_group.parentGroupId,
            }
          ]
        }
        if (userInfo.po.crossGroup) {
          filter = {
            [Op.or]:
              [
                {
                  '$group_group.groupId$': userInfo.groupId,
                },
                {
                  '$group_group.parentGroupId$': userInfo.groupId,
                },
                {
                  '$group_group.groupId$': userInfo.group_group.parentGroupId,
                },
                {
                  '$po.rolePosId$': userInfo.po.rolePosId
                }
              ]
          }
        }
        const listUser = await users.findAll({
          include: [{
            model: group,
            as: "group_group",
          },
          {
            model: position,
            as: "po",
          }],
          where: {
            roleId: ROLE_TYPES.USER,
            userId: {
              [Op.ne]: userId
            },
            ...filter
          },
        })
        const listUserIds = listUser.map(e => e.userId)
        const listUserShare = await shareEvents.findAll({
          where: {
            eventId,
            shareUserId: {
              [Op.in]: listUserIds,
            },
            enable: true
          },
          offset: pagination.offset,
          limit: pagination.limit,
          include: [
            {
              model: users,
              as: "shareUser",
            }
          ],
        });
        const results = listUserShare.map((e) => {
          return onDataUserShareTopicFormat(e);
        });
        return res.send(onSuccess(results));
      }
      // await logAction(ACTION_TYPE.GET, {
      //   ownerId: userId,
      //   description: "Tài khoản không tồn tại",
      // });
      return res.send(
        onError(404, "Tài khoản không tồn tại")
      );
    } catch (error) {
      return res.send(onError(500, error));
    }
  }
};
