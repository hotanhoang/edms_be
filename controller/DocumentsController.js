const fs = require("fs");
const moment = require("moment")
const { onError, onSuccess, hashesID, onDataDocFormat } = require("../utils/utils");
const {
  documents,
  shareDocuments,
  permisionDocument,
  typeOfFile,
  users,
  notification
} = require("../models/init-models");
const {
  ACTION_TYPE,
  ROLE_PERFORM,
  USER_UPLOAD_DOCS,
  CACHE_DOCS,
  PERMISSION,
  TYPE_OF_FILE,
  PAGINATION_CONSTANTS,
  NotificationType,
} = require("../utils/constants");
const { logAction } = require("../utils/activityLog");
const { mkdirDoc } = require("../utils/mkdirDoc");
const { Op, where, fn, col, or } = require("sequelize");
const { zip, COMPRESSION_LEVEL } = require("zip-a-folder");
const { uploadFile } = require("../middleware/fileUpload");
const { fileDetails } = require("../utils/fileUpload");
const path = require("path");
const WordExtractor = require("word-extractor");
const pdf = require('pdf-parse');
const { userInfo } = require("os");
const { sendNotificationToUser } = require("../utils/notification");
const extractor = new WordExtractor();

// function render_page(pageData) {
//   //check documents https://mozilla.github.io/pdf.js/
//   let render_options = {
//     //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
//     normalizeWhitespace: false,
//     //do not attempt to combine same line TextItem's. The default value is `false`.
//     disableCombineTextItems: false
//   }

//   return pageData.getTextContent(render_options)
//     .then(function (textContent) {
//       let lastY, text = '';
//       for (let item of textContent.items) {
//         if (lastY == item.transform[5] || !lastY) {
//           text += item.str;
//         }
//         else {
//           text += item.str //'\n' + item.str;
//         }
//         lastY = item.transform[5];
//       }
//       console.log('text : ', text)
//       return text;
//     });
// }

// let options = {
//   pagerender: render_page
// }

module.exports = {
  // API tạo mới thư mục
  createFolder: async (req, res) => {
    const { userId } = req.user;
    try {
      // Tìm thông tin chủ sở hữu của thư mục
      const userCurrent = await users.findOne({
        where: { userId },
      });
      const { inParentDirId, displayName, description } = req.body;
      // console.log('inParentDirId : ', inParentDirId)
      // console.log(`Tạo mới thư mục ${displayName} với thư mục cha có id là ${inParentDirId}`)
      if (inParentDirId) {
        // Lấy thông tin chi tiết của directory cha
        const documentInfo = await documents.findOne({
          where: {
            documentId: inParentDirId,
            directory: true,
            enable: true,
          },
        });
        if (documentInfo) {
          // Nếu userId hiện tại không là owner của folder
          if (documentInfo.ownerId !== userId) {
            // Kiểm tra folder hiện tại có được chia sẻ với userId và có quyền sửa hay không?
            const resultShare = await shareDocuments.findOne({
              where: {
                shareUserId: userId,
                ownerId: documentInfo.ownerId,
                documentId: inParentDirId,
                enable: true,
              },
            });
            if (!resultShare || resultShare.permissionId !== PERMISSION.WRITE) {
              // response code 403
              // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
              //   ownerId: userId,
              //   ipAddress: req.ip,
              //   visible: true,
              //   description: `Folder không được chia sẻ với ${userCurrent.displayName} hoặc ${userCurrent.displayName} không có quyền thao thác trên thư mục ${documentInfo.displayName}`,
              // });
              return res.send(onError(403, "Tài khoản không có quyền!"));
            }
          }
          //  else {
          //   // response code 403
          //   await logAction(ACTION_TYPE.ADD, {
          //     ownerId: userId,
          //     description: `Tài khoản ${userId} không có quyên!`,
          //   });
          //   return res.send(onError(403, "Tài khoản không có quyền."));
          // }

          // const dirOfCurrentUser = await documents.findOne({
          //   where: {
          //     documentId: inParentDirId,
          //   },
          // });

          // inheritDirectoryId
          // originalDirectoryId

          // const inheritDirectoryIdParnet =
          //   documentInfo.inheritDirectoryId || [];
          // const originalDirectoryId =
          //   documentInfo.originalDirectoryId || documentInfo.documentId;

          // // if (inheritDirectoryId !== null) {
          // //   inheritDirectoryId.forEach((item) => {
          // //     inheritDirctoryIdArray.push(item);
          // //   });
          // // }
          // const inheritDirctoryIdArray = documentInfo.inheritDirectoryId || [];
          // inheritDirctoryIdArray.concat([documentInfo.documentId]);
          // const inheritDirectoryId
          // } else {
          //   // response code 403
          //   await logAction(ACTION_TYPE.ADD, {
          //     ownerId: userId,
          //     description: `Thư mục ${inParentDirId} không tồn tại!`,
          //   });
          //   return res.send(
          //     onError(404, `Thư mục ${inParentDirId} không tồn tại!`)
          //   );
          // }

          // else {
          //   // Lấy thông tin định danh thư mục gốc của userCurrent
          //   const rootDirOfCurrentUser = await documents.findOne({
          //     where: {
          //       ownerId: userId,
          //       directory: true,
          //       parentDirectoryId: null,
          //     },
          //   });
          //   // Gán id của rootDirOfCurrentUser cho inParentDirId
          //   inParentDirId = rootDirOfCurrentUser.documentId;
          // }

          // Tạo thông tin thư mục mới
          // const timestamp = Math.floor(new Date().getTime() / 1000);
          const documentId = hashesID(userCurrent.username);
          // const folderName = await documents.findOne({
          //   where: {
          //     displayName: displayName,
          //     ownerId: userId,
          //     directory: true,
          //     enable: true,
          //   },
          // });
          // if (folderName) {
          //   await logAction(ACTION_TYPE.ADD, {
          //     ownerId: userId,
          //     description: "Tên folder đã tồn tại.",
          //   });
          //   return res.send(onError(413, "Tên folder đã tồn tại"));
          // }

          // Lấy thông tin các documentId của các thư mục cha trước
          const inheritDirctoryIdArray = documentInfo.inheritDirectoryId || [];
          const inheritDirectoryId = inheritDirctoryIdArray.concat([
            documentInfo.documentId,
          ]);

          // Lấy thông tin documentId thư mục root (Thư mục gốc)
          const originalDirectoryId =
            documentInfo.originalDirectoryId || documentInfo.documentId;

          // Tạo mới document vào CSDL
          const newDirectory = await documents.create({
            documentId: documentId,
            parentDirectoryId: inParentDirId,
            displayName: displayName || "",
            directory: true,
            enable: true,
            ownerId: userId,
            description: description || "",
            inheritDirectoryId,
            originalDirectoryId,
          });

          // Kiểm tra xem thư mục cha có được chia sẻ cho userId hoặc listUserId nào không?
          const listShareUserId = await shareDocuments.findAll({
            where: {
              documentId: inParentDirId,
              enable: true,
            },
          });
          if (listShareUserId && listShareUserId.length !== 0) {
            // Tạo các bản ghi chia sẻ cho newDirectory
            var listShareDoc = [];
            listShareUserId.forEach((e) => {
              listShareDoc.push({
                documentId: newDirectory.documentId,
                ownerId: newDirectory.ownerId,
                permissionId: e.permissionId,
                shareUserId: e.shareUserId,
              });
            });
            // Lưu thông tin chia sẻ vào CSDL
            await shareDocuments.bulkCreate(listShareDoc);
            // Cập nhật trang thái share của newDirectory
            newDirectory.share = true;
            await newDirectory.save();
          }
          await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
            ownerId: userId,
            ipAddress: req.ip,
            visible: true,
            description: `Tạo thư mục '${newDirectory.displayName}' thành công`,
          });
          return res.send(onSuccess(newDirectory));

          // listDocs.forEach((e) => {
          //   if (!listShareDocsId.includes(e.documentId)) {
          //     listShareDoc.push({
          //       documentId: e.documentId,
          //       ownerId: e.ownerId,
          //       permissionId: permissionId,
          //       shareUserId: shareUserId,
          //     });
          //   }
          // });

          // if (listShareUserId !== null) {
          //   newDirectory.share = true;
          //   await newDirectory.save();
          //   listShareUserId.forEach(async (item) => {
          //     // Tạo chia sẻ folder mới được tạo với listShareUserId với cùng permission
          //     // như được chia sẻ với parentFolderId
          //     await shareDocuments.create({
          //       documentId: documentId,
          //       ownerId: userId,
          //       shareUserId: item.shareUserId,
          //       permissionId: item.permissionId,
          //       rootShare: false,
          //     });
          //     console.log(`Đã chia sẽ thành công với ${item.shareUserId}`);
          //   });
          //   await logAction(ACTION_TYPE.ADD, {
          //     ownerId: userId,
          //     description: "Tạo folder thành công!",
          //   });
          //   return res.send(onSuccess({ documentId }));
          // }
        }
        // response code 403
        // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: `Thư mục '${inParentDirId}' không tồn tại!`,
        // });
        return res.send(
          onError(404, `Thư mục ${inParentDirId} không tồn tại!`)
        );
      }
      // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: `Thư mục '${inParentDirId}' không tồn tại!`,
      // });
      return res.send(onError(404, `Thư mục ${inParentDirId} không tồn tại!`));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API tạo mới văn bản
  addNewDoc: async (req, res) => {
    const { userId } = req.user;
    try {
      uploadFile(req, res, async (err) => {
        if (err) {
          return res.send(onError(500, err));
        }
        const entity = req.body;
        const userCurrent = await users.findOne({
          where: { userId },
        });
        const documentId = path.parse(req.file.filename).name;
        const typeOfFile = path.parse(req.file.filename).ext;

        const displayName = req.file.originalname;
        const pathToFile = req.file.path;

        // Kích thước thực của file
        const sizeOfFile = req.file.size;
        if (userCurrent) {
          // var sizeOnDisk;
          // var inheritDirectoryId;
          // var inheritDirctoryIdArray = [];
          // Dung lượng của user được cấp từ admin
          const userCapacity = userCurrent.capacity;
          // Dung lượng mà user đã sử dụng
          const usageStorage = userCurrent.usageStorage;
          // Kiểm tra khả năng lưu file hiện tại của folder
          if (userCapacity >= Math.floor(sizeOfFile / 1000) + usageStorage) {
            var inParentDirId = entity.inParentDirId;
            if (inParentDirId) {
              // Lấy thông tin chi tiết của directory
              const folder = await documents.findOne({
                where: {
                  documentId: inParentDirId,
                  directory: true,
                  enable: true,
                },
              });
              if (folder) {
                // Nếu userId hiện tại không là owner của folder
                if (folder.ownerId !== userId) {
                  // Kiểm tra folder hiện tại có được chia sẻ với userId hay không?
                  const resultShare = await shareDocuments.findOne({
                    where: {
                      shareUserId: userId,
                      documentId: inParentDirId,
                      enable: true,
                    },
                  });
                  if (
                    !resultShare ||
                    resultShare.permission !== PERMISSION.WRITE
                  ) {
                    fs.rmSync(pathToFile, { recursive: true, force: true });
                    return res.send(onError(403, "Tài khoản không có quyền!"));
                  }
                }
                //  else {
                //   fs.rmSync(pathToFile, { recursive: true, force: true });
                //   //response code 403
                //   await logAction(ACTION_TYPE.ADD, {
                //     ownerId: userId,
                //     description: `Tài khoản ${userId} không có quyên!`,
                //   });
                //   return res.send(onError(403, "Tài khoản không có quyền."));
                // }
                // const dirOfCurrentUser = await documents.findOne({
                //   where: {
                //     documentId: inParentDirId,
                //   },
                // });
                // inheritDirectoryId = dirOfCurrentUser.inheritdirectoryid;
                // inheritDirectoryId.forEach((item) => {
                //   inheritDirctoryIdArray.push(item);
                // });
                // inheritDirctoryIdArray.push(inParentDirId);

                // Lấy thông tin file con có displayName trong document
                const documentInfo = await documents.findOne({
                  where: {
                    parentDirectoryId: inParentDirId,
                    displayName: displayName,
                    recycleBin: false,
                    enable: true,
                    directory: false,
                  },
                });
                // Nếu file chưa tồn tại
                if (!documentInfo) {
                  // Đọc nội dung của file
                  // Lấy thông tin chi tiết của file trên ổ đĩa
                  const sizeOnDisk = await fileDetails(req, res);
                  // Lấy thông tin các documentId của các thư mục cha trước
                  const inheritDirctoryIdArray =
                    folder.inheritDirectoryId || [];
                  const inheritDirectoryId = inheritDirctoryIdArray.concat([
                    folder.documentId,
                  ]);

                  // Lấy thông tin documentId thư mục root (Thư mục gốc)
                  const originalDirectoryId =
                    folder.originalDirectoryId || folder.documentId;

                  // const timestamp = Math.floor(new Date().getTime() / 1000);
                  // const documentId = hashesID(userCurrent.username);

                  // Đọc nội dung của file tải lên
                  // Kiểm tra xem file đang ở định dạng nào?

                  let content = ""
                  try {
                    if (typeOfFile === ".pdf") {
                      let dataBuffer = fs.readFileSync(pathToFile);
                      const doc = await pdf(dataBuffer) // options
                      content = doc.text
                      // fs.writeFileSync('readFile.txt', content)
                    } else {
                      if (typeOfFile === ".rtf") {
                      } else {
                        const doc = await extractor.extract(pathToFile)
                        content = doc.getBody()
                      }
                    }
                  } catch (error) {
                  }
                  const newFile = {
                    documentId,
                    ownerId: userId,
                    parentDirectoryId: inParentDirId,
                    displayName: displayName,
                    inheritDirectoryId,
                    originalDirectoryId,
                    enable: true,
                    typeOfFileId: TYPE_OF_FILE[typeOfFile],
                    sizeOfFile: Math.floor(sizeOfFile / 1000),
                    sizeOfFileOnDisk: sizeOnDisk.size,
                    directory: false,
                    content: content,
                    // description: "",
                  };
                  // Cập nhật thông tin vào csdl
                  const newDocsUpload = await documents.create(newFile);
                  // Cập nhật thông tin của usageStorage của user
                  userCurrent.usageStorage =
                    userCurrent.usageStorage + sizeOnDisk.size;

                  await userCurrent.save();

                  // Kiểm tra xem thư mục cha có được chia sẻ cho userId hoặc listUserId nào không?
                  const listShareUserId = await shareDocuments.findAll({
                    where: {
                      documentId: inParentDirId,
                      enable: true,
                    },
                  });
                  if (listShareUserId && listShareUserId.length !== 0) {
                    // Tạo các bản ghi chia sẻ cho newDirectory
                    var listShareDoc = [];
                    listShareUserId.forEach((e) => {
                      listShareDoc.push({
                        documentId: newDocsUpload.documentId,
                        ownerId: newDocsUpload.ownerId,
                        permissionId: e.permissionId,
                        shareUserId: e.shareUserId,
                      });
                    });
                    // Lưu thông tin chia sẻ vào CSDL
                    await shareDocuments.bulkCreate(listShareDoc);
                    // Cập nhật trang thái share của newDirectory
                    newDocsUpload.share = true;
                    await newDocsUpload.save();
                  }
                  await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
                    ownerId: userId,
                    ipAddress: req.ip,
                    visible: true,
                    description: `Tải file '${newDocsUpload.displayName}' lên thành công`,
                  });
                  return res.send(onSuccess({}));
                }
                fs.rmSync(pathToFile, { recursive: true, force: true });
                return res.send(onError(413, "Tên file đã tồn tại."));
              }
              fs.rmSync(pathToFile, { recursive: true, force: true });
              return res.send(
                onError(404, `Thư mục ${inParentDirId} không tồn tại!`)
              );
            }
            fs.rmSync(pathToFile, { recursive: true, force: true });
            return res.send(
              onError(404, `Thư mục ${inParentDirId} không tồn tại!`)
            );
            // else {
            //   // Lấy thông tin định danh thư mục gốc của userCurrent
            //   const rootDirOfCurrentUser = await documents.findOne({
            //     where: {
            //       ownerId: userId,
            //       directory: true,
            //       parentDirectoryId: "None",
            //     },
            //   });
            //   // Gán id của rootDirOfCurrentUser cho inParentDirId
            //   inParentDirId = rootDirOfCurrentUser.documentId;
            //   // Lấy [] inherit của thư mục gốc
            //   inheritDirectoryId = rootDirOfCurrentUser.inheritdirectoryid;
            //   if (inheritDirectoryId != null) {
            //     inheritDirectoryId.forEach((item) => {
            //       inheritDirctoryIdArray.push(item);
            //     });
            //   }
            //   inheritDirctoryIdArray.push(inParentDirId);
            // }

            // }
            // else{
            //     //Tạo folder mới
            //     const timestamp = Math.floor(new Date().getTime() / 1000);
            //     const documentId = sha256(timestamp + userCurrent.username);
            //     if(entity.displayName){
            //         const folderName = await documents.findOne({
            //             where: {
            //                 displayName: entity.displayName,
            //                 ownerId: userId,
            //                 directory: true,
            //                 enable: true,
            //             }
            //         });
            //         console.log('folder -> ', folderName);
            //         if(folderName){
            //             fs.unlinkSync(pathToFile);
            //             await logAction(ACTION_TYPE.ADD,{
            //                 ownerId: userId,
            //                 description: "Tên folder đã tồn tại."
            //             });
            //             return res.send(onError(413, "Tên folder đã tồn tại"));
            //         }
            //         await documents.create({
            //             documentId: documentId,
            //             parentDirectoryId: inParentDirId,
            //             displayName: entity.displayName,
            //             directory:true,
            //             enable: true,
            //             ownerId: userId,
            //             description: entity.description ? entity.description : "",
            //             share: false
            //         });
            //     }
            // }
          }
          fs.rmSync(pathToFile, { recursive: true, force: true });
          return res.send(onError(411, "Hết dung lượng lưu trữ"));
        }
        fs.rmSync(pathToFile, { recursive: true, force: true });
        return res.send(onError(403, "Tài khoản không có quyền."));
      });
    } catch (error) {
      if (error.code == "LIMIT_FILE_SIZE") {
        // Kích thước file lớn hơn 25MB
        // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: "Kích thước file lớn hơn 25MB",
        // });
        return res.send(onError(414, "Kích thước file lớn hơn 25MB"));
      }
      // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API lấy danh sách file/thư mục
  // 1. Lấy các file/thư mục sở hữu của userId (enable == true,inOwner = true)
  // 2. Lấy các file/thư mục được chia sẻ với userId (inOwner = true, truy vấn thêm điều kiện shareUserId: userId, enable: true,rootShare: true trong bảng shareDocuments)
  // 3. Lấy các file/thư mục nằm trong thùng rác của userId (enable == true, recycleBin = true, inOwner = true )
  // 4. Lấy các file/thư mục được ownerId chia sẻ với userId (inOwner = true, ownerId, truy vấn thêm điều kiện shareUserId: userId, enable: true,rootShare: true trong bảng shareDocuments)
  // 5. Lấy các file/thư mục nằm trong thư mục cha có documentId (documentId)
  getListDocument: async (req, res) => {
    try {
      const { userId } = req.user;
      const {
        filterAll = false, // Tìm kiếm tất cả file theo điều kiện
        documentId, // Đinh danh document
        enable = true, // Trạng thái bị xoá hay không
        recycleBin = false, // Nằm trong thùng rác
        keywords, // Từ khoá tìm kiếm
        shareUserId, // Định danh người được chia sẻ
        typeOfFiles, // Kiểu file
        dateModify, // Ngày chỉnh sửa
        createdDateStart, // Thời gian tải lên (ngày tạo - lấy giữa 2 khoảng ngày)
        createdDateEnd,
        ownerId, // Định danh chủ sở hữu nào đó.
        inOwner = true, // Tìm kiếm trong file/thư mục sở hữu của userId hay không? : Default : true
        inShare = false, // Lấy danh sách con của documentId được share với userId
        pageSize = PAGINATION_CONSTANTS.default_size,
        pageIndex = PAGINATION_CONSTANTS.default_index,
      } = req.query;

      // Lấy thông tin thư mục root của user
      const rootDocument = await documents.findOne({
        where: {
          ownerId: userId,
          parentDirectoryId: null,
          enable: true,
          recycleBin: false,
        },
      });
      const pagination = req.pagination;
      const filterPagination = {
        offset: pagination.offset,
        limit: pagination.limit,
        order: [["typeOfFileId", "DESC"], ["createdDate", "DESC"]],
      };

      // Tạo bộ lọc lấy danh sách
      const enableQuery =
        enable !== undefined
          ? {
            enable: JSON.parse(enable),
          }
          : {};
      const dirRecycleBin = rootDocument.documentId
        ? {
          parentDirectoryId: rootDocument.documentId,
        }
        : {};
      const recycleBinQuery =
        recycleBin && JSON.parse(recycleBin)
          ? {
            recycleBin: JSON.parse(recycleBin),
            ...dirRecycleBin,
          }
          : { recycleBin: false };
      const keywordsQuery =
        keywords !== undefined
          ? {
            keywords: {
              [Op.in]: JSON.parse(keywords),
            },
          }
          : {};
      const typeOfFilesQuery =
        typeOfFiles !== undefined
          ? {
            typeOfFileId: JSON.parse(typeOfFiles),
            // typeOfFileId: {
            //   [Op.in]: JSON.parse(typeOfFiles),
            // },
          }
          : {};
      const dateModifyQuery =
        dateModify !== undefined
          ? {
            [Op.and]: where(fn('date', col('lastModify')), '=', dateModify)
            // lastModify: {
            //   [Op.between]: [new Date(new Date(dateModify + " 00:00:00").getTime() + TIME_ZONE * 60000),
            //   new Date(new Date(dateModify + " 23:59:59").getTime() + TIME_ZONE * 60000)]
            // },
          }
          : {};

      // const beginningOfDay = moment(dateToFetch, 'YYYY-MM-DD').startOf('day');
      // const endOfDay = moment(dateToFetch, 'YYYY-MM-DD').endOf('day');
      // [Op.gte]: beginningOfDay,
      // [Op.lte]: endOfDay,
      const dateCreateQuery =
        createdDateStart !== undefined && createdDateEnd !== undefined ?
          {
            createdDate: {
              [Op.and]: {
                [Op.gte]: moment(createdDateStart, 'YYYY-MM-DD').startOf('day'),
                [Op.lte]: moment(createdDateEnd, 'YYYY-MM-DD').endOf('day')
              }
            }
          } : {}
      var filter = {
        ...enableQuery,
        ...recycleBinQuery,
        ...keywordsQuery,
        ...typeOfFilesQuery,
        ...dateModifyQuery,
        ...dateCreateQuery
      };

      const filterAllQuery = filterAll !== undefined ? JSON.parse(filterAll) : false;
      // Tìm kiếm tất cả các file thoả mãn điều kiện lọc
      var joinShare = []
      if (filterAllQuery) {
        filter = {
          ...filter,
          // ownerId: userId,
          originalDirectoryId: rootDocument.documentId, // id thư mục gốc
          enable: true,
          directory: false
        };
      } else {
        joinShare = [{
          model: shareDocuments,
          as: "shareDocuments",
          limit: 1,
          required: false,
          where: {
            enable: true
          }
        }]
        const inOwnerQuery = JSON.parse(inOwner);
        // Lấy các document là file/thư mục con của thư mục root mà userId là chủ sở hữu
        if (inOwnerQuery) {
          filter = {
            ...filter,
            ownerId: userId,
            parentDirectoryId: rootDocument.documentId,
            enable: true,
          };
        } else {
          if (ownerId) {
            // Lấy các document của ownerId mà được chia sẻ với userId
            filter = {
              ...filter,
              ownerId: ownerId,
            };
          }
        }
        if (documentId) {
          // Lấy danh sách các file/thư mục con cấp 1 của documentId
          filter = {
            ...filter,
            parentDirectoryId: documentId,
            enable: true,
          };
          // Nếu là con cấp 1 của documentId và phải được chia sẻ với userId
          const inShareQuery = JSON.parse(inShare);
          if (inShareQuery) {
            joinShare = [{
              model: shareDocuments,
              as: "shareDocuments",
              where: {
                shareUserId: userId,
                enable: true,
              },
            }]
          }
        } else {
          // Lấy các document rootShare mà userId được chia sẻ
          joinShare = [{
            model: shareDocuments,
            as: "shareDocuments",
            where: {
              shareUserId: userId,
              enable: true,
              rootShare: true, // Chỉ lấy những file/thư mục gốc cấp 1
            },
          }]
        }
      }
      // Truy vấn lấy danh sách document từ các điều kiện lọc
      const { count, rows } = await documents.findAndCountAll({
        ...filterPagination,
        where: { ...filter },
        include: [{
          model: users,
          as: "owner",
        },
        {
          model: typeOfFile,
          as: "typeOfFile",
        }].concat(joinShare),
      });
      const results = rows.map((e) => {
        return onDataDocFormat(e);
      });
      return res.send(
        onSuccess({
          listDocs: results,
          pageSize: parseInt(pageSize),
          pageIndex: parseInt(pageIndex),
          count,
          inParentDirId: documentId || rootDocument.documentId,
        })
      );
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API sửa thông tin file/thư mục
  // Chỉ người sở hữu/ có quyền sửa
  // Chỉ chủ sở hữu mới có quyền undo file/thư mục
  editDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { documentId } = req.params;
      const { recover, displayName, description, keywords } = req.body;
      // Lấy thông tin file/thư mục theo documentId
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
        },
      });
      if (documentInfo) {
        // Nếu là khôi phục file/thư mục từ thùng rác (recover = true và documentInfo.recycleBin = true)
        // originalDirectoryId : đóng vai trò là Id thư mục cha
        // parentDirectoryId : đóng vai trò là Id thư mục gốc
        if (recover && documentInfo.recycleBin) {
          if (documentInfo.ownerId === userId) {
            // Kiểm tra xem file/thư mục có là file/thư mục con của thư mục nào không?
            if (documentInfo.originalDirectoryId) {
              // Nếu có thì tìm thông tin thư mục cha
              const docParentInfo = await documents.findOne({
                where: {
                  documentId: documentInfo.originalDirectoryId,
                  enable: true, // Không bị xoá
                  recycleBin: false, // Không nằm trong thùng rác
                },
              });
              // Nếu thư mục cha còn tồn tại
              if (docParentInfo) {
                // Đổi lại vị trí của parentDirectoryId và originalDirectoryId
                const parentDirectoryId = documentInfo.parentDirectoryId; // Id thư mục gốc của userId
                documentInfo.parentDirectoryId =
                  documentInfo.originalDirectoryId;
                documentInfo.originalDirectoryId = parentDirectoryId;
                // console.log('documentInfo : ', docParentInfo.inheritDirectoryId, documentInfo.inheritDirectoryId)
                // Khôi phục lại trạng thái inheritDirectoryId cho documentInfo
                documentInfo.inheritDirectoryId = [...docParentInfo.inheritDirectoryId, docParentInfo.documentId]
                // Khôi phục lại trạng thái inheritDirectoryId cho các file/thư mục con của documentInfo
                const listDocs = await documents.findAll({
                  where: {
                    // tất cả file/thư mục con của documentId
                    inheritDirectoryId: {
                      [Op.contains]: documentInfo.documentId,
                    },
                  },
                })
                for (let index = 0; index < listDocs.length; index++) {
                  const element = listDocs[index];
                  const docElement = await documents.findOne({
                    where: {
                      documentId: element.documentId,
                    },
                  });
                  docElement.recycleBin = false
                  // console.log(docElement.displayName) // docParentInfo.inheritDirectoryId, docParentInfo.documentId, docElement.inheritDirectoryId
                  docElement.inheritDirectoryId = [...documentInfo.inheritDirectoryId, ...docElement.inheritDirectoryId.slice(1)]
                  // console.log(docElement.inheritDirectoryId)
                  await docElement.save()
                }
              } else {
                // Nếu không tồn tại thì originalDirectoryId = parentDirectoryId = Id thư mục gốc của userId
                documentInfo.originalDirectoryId =
                  documentInfo.parentDirectoryId;
                // Cập nhật trạng thái recycleBin = false cho các file/ thư mục con của documentInfo
                await documents.update({
                  recycleBin: false
                }, {
                  where: {
                    inheritDirectoryId: {
                      [Op.contains]: documentId, // file/thư mục con của documentId
                    },
                  },
                });
              }
            }
            // Cập nhật trạng thái recycleBin = false cho file/thư mục
            documentInfo.recycleBin = false;
          } else {
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.EDIT_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Tài khoản không được phép thực hiện",
            // });
            return res.send(
              onError(403, "Tài khoản không được phép thực hiện")
            );
          }
        }
        // Truy vấn xem tên file (trừ documentId) có bị trùng lặp với file (cùng thư mục cha) hay không? (Nếu có cập nhật tên)
        if (displayName) {
          const docDuplicateInfo = await documents.findOne({
            where: {
              documentId: {
                [Op.ne]: documentInfo.documentId, // loại trừ documentId
              },
              parentDirectoryId: documentInfo.parentDirectoryId, // Mã thư mục cha
              displayName,
              directory: false,
              enable: true,
            },
          });
          if (docDuplicateInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.EDIT_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Tên file đã tồn tại",
            // });
            return res.send(onError(413, `Tên file '${displayName}'đã tồn tại`));
          }
          documentInfo.lastModify = new Date()
          documentInfo.displayName = displayName;
        }
        // Kiểm tra quyền thao tác file/thư mục
        if (documentInfo.ownerId !== userId) {
          const shareDocInfo = await shareDocuments.findOne({
            where: {
              documentId: documentInfo.documentId,
              shareUserId: userId,
              enable: true,
              permissionId: ROLE_PERFORM.WRITE,
            },
          });
          if (!shareDocInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.EDIT_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Tài khoản không được phép thực hiện",
            // });
            return res.send(
              onError(403, "Tài khoản không có quyền")
            );
          }
        }
        // Kiểm tra xem đây là file hay thư mục. Nếu là file thì cập nhật từ khoá/ mô tả
        if (!documentInfo.directory) {
          if (description || keywords) {
            documentInfo.lastModify = new Date()
          }
          documentInfo.keywords = keywords || documentInfo.keywords;
        }
        if (description === "") documentInfo.description = description;
        else documentInfo.description = description || documentInfo.description;
        // Cập nhật thông tin và CSDL
        await documentInfo.save();
        await logAction(ACTION_TYPE.DOC_ACTION.EDIT_DOC, {
          ownerId: userId,
          ipAddress: req.ip,
          visible: false,
          description: "Cập nhật thông tin thành công",
        });
        return res.send(onSuccess({}));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.DOC_ACTION.EDIT_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "file/thư mục không tồn tại",
      // });
      return res.send(onError(404, "file/thư mục không tồn tại"));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.CREATE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API xoá file/ thư mục
  // originalDirectoryId : Id thư mục gốc của userId
  // parentDirectoryId : Id thư mục cha của file/thư mục
  deleteDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { documentId } = req.params;
      const { rmvPermenent } = req.body;
      // Lấy thông tin của file/thư mục theo documentId
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
        },
      });
      if (documentInfo) {
        // Kiểm tra xem file/thư mục do userId tạo ra hay được chia sẻ từ user khác?
        if (documentInfo.ownerId !== userId) {
          // Kiểm tra xem userId có quyền xoá file/thư mục không?
          const shareDocInfo = await shareDocuments.findOne({
            where: {
              documentId: documentInfo.documentId,
              shareUserId: userId,
              enable: true,
              permissionId: ROLE_PERFORM.WRITE, // Quyền chỉnh sửa file/thư mục
            },
          });
          if (!shareDocInfo) {
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: false,
            //   description: "Tài khoản không được phép thực hiện",
            // });
            return res.send(
              onError(403, "Tài khoản không có quyền")
            );
          }
        }
        if (rmvPermenent) {
          // Nếu xoá vĩnh viễn thì cập nhật enable = false cho documentId và file/ thư mục con của documentId
          await documents.update({
            enable: false
          }, {
            where: {
              [Op.or]: [
                {
                  documentId,
                },
                {
                  inheritDirectoryId: {
                    [Op.contains]: documentId, // file/thư mục con của documentId
                  },
                },
              ],
              recycleBin: true
            },
          });
          // Đồng thời lấy và xoá luôn các file lưu trên ổ đĩa (bao gồm cả documentInfo)
          const listDocs = await documents.findAll({
            where: {
              [Op.or]: [
                {
                  documentId, // bao gồm cả documentInfo
                },
                {
                  inheritDirectoryId: {
                    [Op.contains]: documentId, // file/thư mục con của documentId
                  },
                },
              ],
              recycleBin: true
            },
            include: {
              model: typeOfFile,
              as: "typeOfFile",
            },
          })
          // Lấy các document là file
          let sizeOfFileOnDisk = 0
          for (let index = 0; index < listDocs.length; index++) {
            const element = listDocs[index];
            if (!element.directory) {
              // Lấy đường dẫn file
              const path = `${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${element.documentId}${element.typeOfFile.displayName}`
              // Tiến hành xoá file trên ổ đĩa
              fs.rmSync(path, { recursive: true, force: true });
              // Tính tổng dung lương file lưu trên ổ đĩa
              sizeOfFileOnDisk += element.sizeOfFile
            }
          }
          // Lấy thông tin chủ sở hữu của document
          const userInfo = await users.findOne({
            where: { userId },
          });
          // Tính tổng lại số dung lương bộ nhớ đã dùng và cập nhật lại cho người dùng
          const usageStorage = userInfo.usageStorage - sizeOfFileOnDisk
          userInfo.usageStorage = usageStorage
          await userInfo.save()
        } else {
          // Đổi giá trị originalDirectoryId và parentDirectoryId cho nhau
          // Điều này phục vụ cho việc lấy danh sách các file/thư mục nằm trong thùng rác (Nếu là di chuyển file đến thùng rác)
          const originalDirectoryId = documentInfo.originalDirectoryId; // Id thư mục gốc của userId
          documentInfo.originalDirectoryId = documentInfo.parentDirectoryId;
          documentInfo.parentDirectoryId = originalDirectoryId;
          // Cập nhật trạng thái cho documentId
          documentInfo.recycleBin = true;
          // Cập nhật inheritDirectoryId cho documentId
          documentInfo.inheritDirectoryId = [originalDirectoryId]
          await documentInfo.save();
          // Cập nhật cho các thư mục con
          const listDocs = await documents.findAll({
            where: {
              // tất cả file/thư mục con của documentId
              inheritDirectoryId: {
                [Op.contains]: documentInfo.documentId,
              },
            },
          })
          // Lặp để cập nhật inheritDirectoryId và recycleBin cho các file/thư mục con
          // let listDocsTrash = []
          for (let index = 0; index < listDocs.length; index++) {
            const element = listDocs[index];
            const indexOf = element.inheritDirectoryId.indexOf(documentId)
            const inheritDirectoryId = [...documentInfo.inheritDirectoryId, ...element.inheritDirectoryId.slice(indexOf)]
            const docElement = await documents.findOne({
              where: {
                documentId: element.documentId,
              },
            });
            docElement.recycleBin = true
            docElement.inheritDirectoryId = inheritDirectoryId
            await docElement.save()
          }
        }
        // Ghi log
        await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
          ownerId: userId,
          ipAddress: req.ip,
          visible: false,
          description: `${rmvPermenent
            ? `Xoá file/thư mục '${documentInfo.displayName}' thành công`
            : `Đã di chuyển file/thư mục '${documentInfo.displayName}' đến thùng rác`
            }`,
        });
        return res.send(onSuccess({}));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "file/thư mục không tồn tại",
      // });
      return res.send(onError(404, "file/thư mục không tồn tại"));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  deleteDocument_v2: async (req, res) => {
    const { userId } = req.user;
    try {
      const { listDocumentId, rmvPermenent } = req.body;
      // Lấy thông tin của file/thư mục theo documentId
      const listDocumentInfo = await documents.findAll({
        where: {
          documentId: {
            [Op.in]: listDocumentId
          },
          enable: true,
        },
      });
      if (listDocumentInfo && listDocumentInfo.length !== 0) {
        // Kiểm tra xem file/thư mục do userId tạo ra hay được chia sẻ từ user khác?
        for (let index = 0; index < listDocumentInfo.length; index++) {
          const documentInfo = listDocumentInfo[index];
          if (documentInfo.ownerId !== userId) {
            // Kiểm tra xem userId có quyền xoá file/thư mục không?
            const shareDocInfo = await shareDocuments.findOne({
              where: {
                documentId: documentInfo.documentId,
                shareUserId: userId,
                enable: true,
                permissionId: ROLE_PERFORM.WRITE, // Quyền chỉnh sửa file/thư mục
              },
            });
            if (!shareDocInfo) {
              // Ghi log
              // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
              //   ownerId: userId,
              //   ipAddress: req.ip,
              //   visible: false,
              //   description: "Tài khoản không được phép thực hiện",
              // });
              return res.send(
                onError(403, "Tài khoản không có quyền")
              );
            }
          }

          if (rmvPermenent) {
            // Nếu xoá vĩnh viễn thì cập nhật enable = false cho documentId và file/ thư mục con của documentId
            await documents.update({
              enable: false
            }, {
              where: {
                [Op.or]: [
                  {
                    documentId: documentInfo.documentId,
                  },
                  {
                    inheritDirectoryId: {
                      [Op.contains]: documentInfo.documentId, // file/thư mục con của documentId
                    },
                  },
                ],
                recycleBin: true
              },
            });
            // Đồng thời lấy và xoá luôn các file lưu trên ổ đĩa (bao gồm cả documentInfo)
            const listDocs = await documents.findAll({
              where: {
                [Op.or]: [
                  {
                    documentId: documentInfo.documentId, // bao gồm cả documentInfo
                  },
                  {
                    inheritDirectoryId: {
                      [Op.contains]: documentInfo.documentId, // file/thư mục con của documentId
                    },
                  },
                ],
                recycleBin: true
              },
              include: {
                model: typeOfFile,
                as: "typeOfFile",
              },
            })
            // Lấy các document là file
            let sizeOfFileOnDisk = 0
            for (let index = 0; index < listDocs.length; index++) {
              const element = listDocs[index];
              if (!element.directory) {
                // Lấy đường dẫn file
                const path = `${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${element.documentId}${element.typeOfFile.displayName}`
                // Tiến hành xoá file trên ổ đĩa
                fs.rmSync(path, { recursive: true, force: true });
                // Tính tổng dung lương file lưu trên ổ đĩa
                sizeOfFileOnDisk += element.sizeOfFile
              }
            }
            // Lấy thông tin chủ sở hữu của document
            const userInfo = await users.findOne({
              where: { userId },
            });
            // Tính tổng lại số dung lương bộ nhớ đã dùng và cập nhật lại cho người dùng
            const usageStorage = userInfo.usageStorage - sizeOfFileOnDisk
            userInfo.usageStorage = usageStorage
            await userInfo.save()
          } else {
            // Đổi giá trị originalDirectoryId và parentDirectoryId cho nhau
            // Điều này phục vụ cho việc lấy danh sách các file/thư mục nằm trong thùng rác (Nếu là di chuyển file đến thùng rác)
            const originalDirectoryId = documentInfo.originalDirectoryId; // Id thư mục gốc của userId
            documentInfo.originalDirectoryId = documentInfo.parentDirectoryId;
            documentInfo.parentDirectoryId = originalDirectoryId;
            // Cập nhật trạng thái cho documentId
            documentInfo.recycleBin = true;
            // Cập nhật inheritDirectoryId cho documentId
            documentInfo.inheritDirectoryId = [originalDirectoryId]
            await documentInfo.save();
            // Cập nhật cho các thư mục con
            const listDocs = await documents.findAll({
              where: {
                // tất cả file/thư mục con của documentId
                inheritDirectoryId: {
                  [Op.contains]: documentInfo.documentId,
                },
              },
            })
            // Lặp để cập nhật inheritDirectoryId và recycleBin cho các file/thư mục con
            // let listDocsTrash = []
            for (let index = 0; index < listDocs.length; index++) {
              const element = listDocs[index];
              const indexOf = element.inheritDirectoryId.indexOf(documentInfo.documentId)
              const inheritDirectoryId = [...documentInfo.inheritDirectoryId, ...element.inheritDirectoryId.slice(indexOf)]
              const docElement = await documents.findOne({
                where: {
                  documentId: element.documentId,
                },
              });
              docElement.recycleBin = true
              docElement.inheritDirectoryId = inheritDirectoryId
              await docElement.save()
            }
          }
        }
        // Ghi log
        await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
          ownerId: userId,
          ipAddress: req.ip,
          visible: false,
          description: `${rmvPermenent
            ? `Xoá văn bản thành công`
            : `Đã di chuyển văn bản đến thùng rác`
            }`,
        });
        return res.send(onSuccess({}));
      }
      // Ghi log
      // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: "file/thư mục không tồn tại",
      // });
      return res.send(onError(404, "file/thư mục không tồn tại"));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API chia sẻ file/thư mục
  // shareDocument: async (req, res) => {
  //   const { userId } = req.user;
  //   try {
  //     const { documentId } = req.params;
  //     const { permissionId, listShareUserId } = req.body;
  //     const userInfo = await users.findOne({
  //       where: {
  //         userId: userId,
  //       }
  //     });
  //     // Kiểm tra tính hợp lệ của quyền
  //     const permissionInfo = await permisionDocument.findOne({
  //       where: {
  //         permissionId,
  //       },
  //     });
  //     if (!permissionInfo) {
  //       // Ghi log
  //       // await logAction(ACTION_TYPE.DOC_ACTION.SHARE_DOC, {
  //       //   ownerId: userId,
  //       //   ipAddress: req.ip,
  //       //   documentId: documentId,
  //       //   visible: true,
  //       //   description: "Quyền thực hiện không hợp lệ",
  //       // });
  //       return res.send(onError(404, "Quyền thực hiện không hợp lệ"));
  //     }
  //     // Lấy thông tin document
  //     const documentInfo = await documents.findOne({
  //       where: {
  //         documentId,
  //         enable: true,
  //         recycleBin: false
  //       },
  //     });
  //     if (documentInfo) {
  //       if (documentInfo.ownerId !== userId) {
  //         // Kiểm tra xem file/thư mục đó có được chia sẻ quyền chỉnh sửa/ quyền tương đương (permissionId) với userId hay không?
  //         const docShareUserId = await shareDocuments.findOne({
  //           where: {
  //             documentId: documentId,
  //             shareUserId: userId,
  //             [Op.or]: [
  //               {
  //                 permissionId,
  //               },
  //               {
  //                 permissionId: PERMISSION.WRITE
  //               },
  //             ],
  //             enable: true,
  //           },
  //         });
  //         if (!docShareUserId) {
  //           // await logAction(ACTION_TYPE.DOC_ACTION.SHARE_DOC, {
  //           //   ownerId: userId,
  //           //   ipAddress: req.ip,
  //           //   documentId: documentId,
  //           //   visible: true,
  //           //   description: "Tài khoản không được phép thực hiện",
  //           // });
  //           return res.send(
  //             onError(403, "Tài khoản không được phép thực hiện")
  //           );
  //         }
  //       }
  //       // Lấy danh sách tất cả các file/thư mục gốc và con theo documentId
  //       const listDocs = await documents.findAll({
  //         where: {
  //           [Op.or]: [
  //             {
  //               documentId,
  //             },
  //             {
  //               inheritDirectoryId: {
  //                 [Op.contains]: documentId, // file/thư mục con của documentId
  //               },
  //             },
  //           ],
  //           enable: true, // Không bị xoá
  //         },
  //       });
  //       // Lấy danh sách các file/thư mục con của documentId đã share cho listShareUserId (nếu có) bao gồm cả quyền đã bị xoá.
  //       const listDocumentId = listDocs.map(e => e.documentId)
  //       const resultShareUserId = await shareDocuments.findAll({
  //         where: {
  //           documentId: {
  //             [Op.in]: listDocumentId,
  //           },
  //           shareUserId: {
  //             [Op.in]: listShareUserId,
  //           },
  //         },
  //       });
  //       var listShareDoc = [];
  //       var shareDocumentsId = []
  //       var rootShareDocumentsId = null
  //       listDocs.forEach((e) => {
  //         listShareUserId.forEach(id => {
  //           // Tìm xem documentId đã được chia sẻ với shareUserId hay chưa
  //           const shareUser = resultShareUserId.find(b => (b.documentId === e.documentId && b.shareUserId === id))
  //           if (!shareUser) {
  //             // Nếu chưa thì tạo mới
  //             listShareDoc.push({
  //               documentId: e.documentId,
  //               ownerId: e.ownerId,
  //               permissionId: permissionId,
  //               shareUserId: id,
  //               rootShare: e.documentId === documentId
  //             });
  //           } else {
  //             // Nếu có rồi thì kiểm tra xem đã bị disable hay chưa?
  //             if (!shareUser.enable || shareUser.permissionId !== permissionId) {
  //               // Nếu đã bị disable hoặc khác quyền thì thực hiện cập nhật
  //               if (shareUser.documentId !== documentId) {
  //                 shareDocumentsId.push(shareUser.id)
  //               } else {
  //                 rootShareDocumentsId = shareUser.id
  //               }
  //             }
  //           }
  //         });
  //       });
  //       // Thêm mới chia sẻ nếu chưa tồn tại
  //       await shareDocuments.bulkCreate(listShareDoc);
  //       // Cập nhật lại enable = true,permissionId = permissionId nếu là khôi phục chia sẻ/ chỉnh sửa quyền
  //       await shareDocuments.update({
  //         enable: true,
  //         permissionId: permissionId,
  //         sharedAt: new Date()
  //       }, {
  //         where: {
  //           id: {
  //             [Op.in]: shareDocumentsId, // id của các bản ghi chia sẻ cần khôi phục
  //           },
  //         },
  //       });
  //       // Cập nhật rootShare = true
  //       if (rootShareDocumentsId) {
  //         await shareDocuments.update({
  //           enable: true,
  //           permissionId: permissionId,
  //           rootShare: true,
  //           sharedAt: new Date()
  //         }, {
  //           where: {
  //             id: rootShareDocumentsId,
  //           },
  //         });
  //       }
  //       // Ghi log
  //       const notificationLog = await logAction(ACTION_TYPE.DOC_ACTION.SHARE_DOC, {
  //         ownerId: userId,
  //         ipAddress: req.ip,
  //         documentId: documentId,
  //         visible: true,
  //         description: `Chia sẻ file/thư mục "${documentInfo.displayName}" thành công`,
  //       });
  //       listShareUserId.forEach(async (id) => {
  //         const notificationContent = {
  //           userId: id,
  //           activityLogId: notificationLog.id,
  //           read: false,
  //           displayName: `"${userInfo.displayName}" đã chia sẻ cho bạn file/thư mục "${documentInfo.displayName}"`
  //         }
  //         await notification.create(notificationContent);
  //         sendNotificationToUser(
  //           id,
  //           NotificationType.NOTIFICATION_SHARE_DOC,
  //           `"${userInfo.displayName}" đã chia sẻ cho bạn file/thư mục "${documentInfo.displayName}"`
  //         )
  //       })
  //       // return res.send(onSuccess(listShareDoc));
  //       return res.send(onSuccess({ content: `"${userInfo.displayName}" đã chia sẻ cho bạn file/thư mục "${documentInfo.displayName}"` }));
  //     }
  //     return res.send(onError(404, "Không tìm thấy tài liệu cần chia sẻ"));
  //   } catch (error) {
  //     return res.send(onError(500, error));
  //   }
  // },
  shareDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { listDocumentId, permissionId, listShareUserId } = req.body;
      const userInfo = await users.findOne({
        where: {
          userId: userId,
        }
      });
      // Kiểm tra tính hợp lệ của quyền
      const permissionInfo = await permisionDocument.findOne({
        where: {
          permissionId,
        },
      });
      if (!permissionInfo) {
        return res.send(onError(404, "Quyền thực hiện không hợp lệ"));
      }

      const listDocumentInfo = await documents.findAll({
        where: {
          documentId: {
            [Op.in]: listDocumentId
          },
          enable: true,
        },
      });

      if (listDocumentInfo && listDocumentInfo.length !== 0) {
        for (let index = 0; index < listDocumentInfo.length; index++) {
          const documentInfo = listDocumentInfo[index];
          if (documentInfo.ownerId !== userId) {
            // Kiểm tra xem file/thư mục đó có được chia sẻ quyền chỉnh sửa/ quyền tương đương (permissionId) với userId hay không?
            const docShareUserId = await shareDocuments.findOne({
              where: {
                documentId: documentInfo.documentId,
                shareUserId: userId,
                [Op.or]: [
                  {
                    permissionId,
                  },
                  {
                    permissionId: PERMISSION.WRITE
                  },
                ],
                enable: true,
              },
            });
            if (!docShareUserId) {
              // await logAction(ACTION_TYPE.DOC_ACTION.SHARE_DOC, {
              //   ownerId: userId,
              //   ipAddress: req.ip,
              //   documentId: documentId,
              //   visible: true,
              //   description: "Tài khoản không được phép thực hiện",
              // });
              return res.send(
                onError(403, "Tài khoản không được phép thực hiện")
              );
            }
          }
          // Lấy danh sách tất cả các file/thư mục gốc và con theo documentId
          const listDocs = await documents.findAll({
            where: {
              [Op.or]: [
                {
                  documentId: documentInfo.documentId,
                },
                {
                  inheritDirectoryId: {
                    [Op.contains]: documentInfo.documentId, // file/thư mục con của documentId
                  },
                },
              ],
              enable: true, // Không bị xoá
            },
          });
          // Lấy danh sách các file/thư mục con của documentId đã share cho listShareUserId (nếu có) bao gồm cả quyền đã bị xoá.
          const listDocId = listDocs.map(e => e.documentId)
          const resultShareUserId = await shareDocuments.findAll({
            where: {
              documentId: {
                [Op.in]: listDocId,
              },
              shareUserId: {
                [Op.in]: listDocId,
              },
            },
          });
          var listShareDoc = [];
          var shareDocumentsId = []
          var rootShareDocumentsId = null
          listDocs.forEach((e) => {
            listShareUserId.forEach(id => {
              // Tìm xem documentId đã được chia sẻ với shareUserId hay chưa
              const shareUser = resultShareUserId.find(b => (b.documentId === e.documentId && b.shareUserId === id))
              if (!shareUser) {
                // Nếu chưa thì tạo mới
                listShareDoc.push({
                  documentId: e.documentId,
                  ownerId: e.ownerId,
                  permissionId: permissionId,
                  shareUserId: id,
                  rootShare: e.documentId === documentInfo.documentId
                });
              } else {
                // Nếu có rồi thì kiểm tra xem đã bị disable hay chưa?
                if (!shareUser.enable || shareUser.permissionId !== permissionId) {
                  // Nếu đã bị disable hoặc khác quyền thì thực hiện cập nhật
                  if (shareUser.documentId !== documentInfo.documentId) {
                    shareDocumentsId.push(shareUser.id)
                  } else {
                    rootShareDocumentsId = shareUser.id
                  }
                }
              }
            });
          });
          // Thêm mới chia sẻ nếu chưa tồn tại
          await shareDocuments.bulkCreate(listShareDoc);
          // Cập nhật lại enable = true,permissionId = permissionId nếu là khôi phục chia sẻ/ chỉnh sửa quyền
          await shareDocuments.update({
            enable: true,
            permissionId: permissionId,
            sharedAt: new Date()
          }, {
            where: {
              id: {
                [Op.in]: shareDocumentsId, // id của các bản ghi chia sẻ cần khôi phục
              },
            },
          });
          // Cập nhật rootShare = true
          if (rootShareDocumentsId) {
            await shareDocuments.update({
              enable: true,
              permissionId: permissionId,
              rootShare: true,
              sharedAt: new Date()
            }, {
              where: {
                id: rootShareDocumentsId,
              },
            });
          }
          // Ghi log
          const notificationLog = await logAction(ACTION_TYPE.DOC_ACTION.SHARE_DOC, {
            ownerId: userId,
            ipAddress: req.ip,
            documentId: documentInfo.documentId,
            visible: true,
            description: `Chia sẻ file/thư mục "${documentInfo.displayName}" thành công`,
          });
          listShareUserId.forEach(async (id) => {
            const notificationContent = {
              userId: id,
              activityLogId: notificationLog.id,
              read: false,
              displayName: `"${userInfo.displayName}" đã chia sẻ cho bạn file/thư mục "${documentInfo.displayName}"`
            }
            await notification.create(notificationContent);
            sendNotificationToUser(
              id,
              NotificationType.NOTIFICATION_SHARE_DOC,
              `"${userInfo.displayName}" đã chia sẻ cho bạn file/thư mục "${documentInfo.displayName}"`
            )
          })
        }
        return res.send(onSuccess({ content: `"${userInfo.displayName}" đã chia sẻ văn bản cho bạn` }));
      }
      return res.send(onError(404, "Không tìm thấy tài liệu cần chia sẻ"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API xoá thông tin chia sẻ file/thư mục
  // Chỉ có chủ sở hữu mới được quyền xoá
  deleteShareDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { documentId } = req.params;
      const { listShareUserId, permissionId } = req.body;
      // Lấy thông tin file/thư mục cần xoá
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
        },
      });
      if (documentInfo.ownerId !== userId) {
        // Kiểm tra xem user có quyền chỉnh sửa hay không?
        const docShareUserId = await shareDocuments.findOne({
          where: {
            shareUserId: userId,
            documentId: documentId,
            permissionId: PERMISSION.WRITE,
            enable: true,
          },
        });
        if (!docShareUserId) {
          // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_SHARE_DOC, {
          //   ownerId: userId,
          //   ipAddress: req.ip,
          //   visible: false,
          //   description: "Tài khoản không được phép thực hiện",
          // });
          return res.send(
            onError(403, "Tài khoản không được phép thực hiện")
          );
        }
      }
      // Kiểm tra quyền có hợp lệ hay không?
      const permissionInfo = await permisionDocument.findOne({
        where: {
          permissionId,
        },
      });
      if (!permissionInfo) {
        // Ghi log
        // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_SHARE_DOC, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: false,
        //   description: "Quyền xoá không hợp lệ",
        // });
        return res.send(onError(404, "Quyền xoá không hợp lệ"));
      }
      // Lấy danh sách tất cả các file/thư mục gốc và con theo documentId
      const listDocs = await documents.findAll({
        where: {
          [Op.or]: [
            {
              documentId,
            },
            {
              inheritDirectoryId: {
                [Op.contains]: documentId, // file/thư mục con của documentId
              },
            },
          ],
          enable: true, // Không bị xoá
        },
      });
      // Danh sách id của documentId + file/thư mục con của documentId
      const listShareDocsId = listDocs.map((e) => e.documentId);
      // Thiết lập enable = false với các bản ghi trong shareDocuments cho listShareUserId theo documentId
      await shareDocuments.update(
        {
          enable: false,
          rootShare: false
        },
        {
          where: {
            documentId: {
              [Op.in]: listShareDocsId,
            },
            // ownerId: userId,
            shareUserId: {
              [Op.in]: listShareUserId
            },
            permissionId,
            enable: true,
          },
        }
      );
      // Ghi log
      await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_SHARE_DOC, {
        ownerId: userId,
        ipAddress: req.ip,
        visible: true,
        documentId: documentId,
        description: `Xoá chia sẻ file/thư mục "${documentInfo.displayName}" thành công`,
      });
      return res.send(onSuccess({}));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.REMOVE_SHARE_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API di chuyển file/thư mục
  // Di chuyển thư mục do mình sở hữu đến thư mục mình sở hữu khác hoăc thư mục mình được chia sẻ quyền sửa (permission = 1)
  // moveDocument: async (req, res) => {
  //   const { userId } = req.user;
  //   try {
  //     const { documentId, destDirectoryId } = req.body;
  //     // Lấy thông tin file/thư mục cần di chuyển
  //     const documentInfo = await documents.findOne({
  //       where: {
  //         documentId,
  //         enable: true,
  //       },
  //     });
  //     if (!documentInfo)
  //       // Ghi log
  //       // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //       //   ownerId: userId,
  //       //   ipAddress: req.ip,
  //       //   visible: true,
  //       //   description: "Không tìm thấy file/thư mục",
  //       // });
  //       return res.send(onError(404, "Không tìm thấy file/thư mục"));

  //     // Kiểm tra quyền di chuyển file/thư mục (chỉ chủ sở hữu)
  //     if (documentInfo.ownerId !== userId)
  //       // Ghi log
  //       // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //       //   ownerId: userId,
  //       //   ipAddress: req.ip,
  //       //   visible: true,
  //       //   description: "Tài khoản không được phép thực hiện",
  //       // });
  //       return res.send(onError(403, "Tài khoản không được phép thực hiện"));

  //     // Lấy thông tin thư mục di chuyển đến
  //     const directoryQuery = destDirectoryId === null ? {
  //       originalDirectoryId: null,
  //       ownerId: userId
  //     } : {
  //       documentId: destDirectoryId
  //     }
  //     const directoryInfo = await documents.findOne({
  //       where: {
  //         ...directoryQuery,
  //         enable: true,
  //         directory: true,
  //       },
  //     });
  //     if (!directoryInfo)
  //       // Ghi log
  //       // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //       //   ownerId: userId,
  //       //   ipAddress: req.ip,
  //       //   visible: true,
  //       //   description: "Không tìm thấy thư mục",
  //       // });
  //       return res.send(onError(404, "Không tìm thấy thư mục"));

  //     // Kiểm tra quyền userId đối với destDirectory(chỉ chủ sở hữu hoặc người được chia sẻ quyền chỉnh sửa )
  //     if (directoryInfo.ownerId !== userId) {
  //       const shareDocInfo = await shareDocuments.findOne({
  //         where: {
  //           documentId: directoryInfo.documentId,
  //           permissionId: ROLE_PERFORM.WRITE,
  //         },
  //       });
  //       if (!shareDocInfo)
  //         // Ghi log
  //         // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //         //   ownerId: userId,
  //         //   ipAddress: req.ip,
  //         //   visible: true,
  //         //   description: "Tài khoản không được phép thực hiện",
  //         // });
  //         return res.send(onError(403, "Tài khoản không được phép thực hiện"));
  //     }
  //     // Lấy danh sách các file/thư mục con của documentId (mục chia sẻ)
  //     const listDocs = await documents.findAll({
  //       where: {
  //         [Op.or]: [
  //           {
  //             documentId,
  //           },
  //           {
  //             inheritDirectoryId: {
  //               [Op.contains]: documentId, // file/thư mục con của documentId
  //             },
  //           },
  //         ],
  //         enable: true, // Không bị xoá
  //       },
  //     });
  //     for (let index = 0; index < listDocs.length; index++) {
  //       const elementDoc = listDocs[index]
  //       if (elementDoc.documentId === documentId) {
  //         elementDoc.parentDirectoryId = directoryInfo.documentId // id thư mục cha
  //         elementDoc.originalDirectoryId = directoryInfo.originalDirectoryId || directoryInfo.documentId  // id thư mục gốc
  //         elementDoc.inheritDirectoryId = [...directoryInfo.inheritDirectoryId, directoryInfo.documentId] // các cấp thư mục cha
  //       } else {
  //         elementDoc.originalDirectoryId = directoryInfo.originalDirectoryId || directoryInfo.documentId // id thư mục gốc
  //         // Thiết lập lại các cấp thư mục cha
  //         const indexOf = elementDoc.inheritDirectoryId.indexOf(documentId)
  //         // console.log('indexOf : ', indexOf)
  //         const inheritDirectoryId = [...documentInfo.inheritDirectoryId, directoryInfo.documentId, ...elementDoc.inheritDirectoryId.slice(indexOf)]

  //         elementDoc.inheritDirectoryId = inheritDirectoryId
  //       }
  //       await elementDoc.save()
  //     }
  //     // Lấy các chia sẻ của destDirectoryId (các chia sẻ tồn tại)
  //     const shareDestDirectory = await shareDocuments.findAll({
  //       where: {
  //         documentId: directoryInfo.documentId,
  //         enable: true,
  //       },
  //     });
  //     var listShareDoc = []; // các bản ghi chia sẻ cần thêm
  //     // Duyệt từng bản ghi đã chia sẻ
  //     for (let index = 0; index < shareDestDirectory.length; index++) {
  //       const a = shareDestDirectory[index];
  //       var shareIdsDocument = [] // các bản ghi chia sẻ cần cập nhật
  //       // Không thêm bản ghi chia sẻ cho chính mình
  //       if (userId !== a.shareUserId) {
  //         // Duyệt từng document trong listDocs xem đã được chia sẻ với a.shareUserId hay chưa?
  //         for (let x = 0; x < listDocs.length; x++) {
  //           const b = listDocs[x];
  //           const shareUserId = await shareDocuments.findOne({
  //             where: {
  //               documentId: b.documentId,
  //               shareUserId: a.shareUserId,
  //               // permissionId,
  //               // enable: true,
  //             },
  //           });
  //           if (shareUserId) {
  //             if (a.permissionId !== b.permissionId) {
  //               // Sửa quyền chia sẻ
  //               shareIdsDocument.push(b.id)
  //             } else {
  //               // Khôi phục quyền chia sẻ
  //               if (!b.enable) {
  //                 shareIdsDocument.push(b.id)
  //               }
  //             }
  //           } else {
  //             // Chưa được chia sẻ với a.shareUserId
  //             listShareDoc.push({
  //               documentId: b.documentId,
  //               ownerId: b.ownerId,
  //               permissionId: a.permissionId,
  //               shareUserId: a.shareUserId,
  //             });
  //           }
  //         }
  //         // Cập nhật lại enable = true,permissionId = permissionId nếu là khôi phục chia sẻ/ chỉnh sửa quyền
  //         await shareDocuments.update({
  //           enable: true,
  //           permissionId: a.permissionId,
  //           sharedAt: new Date()
  //         }, {
  //           where: {
  //             id: {
  //               [Op.in]: shareIdsDocument, // Id của các bản ghi chia sẻ cần khôi phục/ sửa quyền chia sẻ
  //             },
  //           },
  //         });
  //       }
  //     }
  //     // Thêm mới các bản ghi đối với listShareDoc
  //     await shareDocuments.bulkCreate(listShareDoc);
  //     // Ghi log
  //     await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //       ownerId: userId,
  //       ipAddress: req.ip,
  //       visible: true,
  //       documentId: documentId,
  //       description: `Di chuyển file/thư mục "${documentInfo.displayName}" thành công`,
  //     });
  //     return res.send(onSuccess({}));
  //   } catch (error) {
  //     // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
  //     //   ownerId: userId,
  //     //   ipAddress: req.ip,
  //     //   visible: false,
  //     //   description: error.message,
  //     // });
  //     return res.send(onError(500, error));
  //   }
  // },
  moveDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { listDocumentId, destDirectoryId } = req.body;
      const listDocumentInfo = await documents.findAll({
        where: {
          documentId: {
            [Op.in]: listDocumentId
          },
          enable: true,
        },
      });
      if (listDocumentInfo && listDocumentInfo.length !== 0) {
        for (let index = 0; index < listDocumentInfo.length; index++) {
          const documentInfo = listDocumentInfo[index];

          // Kiểm tra quyền di chuyển file/thư mục (chỉ chủ sở hữu)
          if (documentInfo.ownerId !== userId)
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: true,
            //   description: "Tài khoản không được phép thực hiện",
            // });
            return res.send(onError(403, "Tài khoản không được phép thực hiện"));

          // Lấy thông tin thư mục di chuyển đến
          const directoryQuery = destDirectoryId === null ? {
            originalDirectoryId: null,
            ownerId: userId
          } : {
            documentId: destDirectoryId
          }
          const directoryInfo = await documents.findOne({
            where: {
              ...directoryQuery,
              enable: true,
              directory: true,
            },
          });
          if (!directoryInfo)
            // Ghi log
            // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
            //   ownerId: userId,
            //   ipAddress: req.ip,
            //   visible: true,
            //   description: "Không tìm thấy thư mục",
            // });
            return res.send(onError(404, "Không tìm thấy thư mục"));

          // Kiểm tra quyền userId đối với destDirectory(chỉ chủ sở hữu hoặc người được chia sẻ quyền chỉnh sửa )
          if (directoryInfo.ownerId !== userId) {
            const shareDocInfo = await shareDocuments.findOne({
              where: {
                documentId: directoryInfo.documentId,
                permissionId: ROLE_PERFORM.WRITE,
              },
            });
            if (!shareDocInfo)
              // Ghi log
              // await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
              //   ownerId: userId,
              //   ipAddress: req.ip,
              //   visible: true,
              //   description: "Tài khoản không được phép thực hiện",
              // });
              return res.send(onError(403, "Tài khoản không được phép thực hiện"));
          }
          // Lấy danh sách các file/thư mục con của documentId (mục chia sẻ)
          const listDocs = await documents.findAll({
            where: {
              [Op.or]: [
                {
                  documentId: documentInfo.documentId,
                },
                {
                  inheritDirectoryId: {
                    [Op.contains]: documentInfo.documentId, // file/thư mục con của documentId
                  },
                },
              ],
              enable: true, // Không bị xoá
            },
          });
          for (let index = 0; index < listDocs.length; index++) {
            const elementDoc = listDocs[index]
            if (elementDoc.documentId === documentInfo.documentId) {
              elementDoc.parentDirectoryId = directoryInfo.documentId // id thư mục cha
              elementDoc.originalDirectoryId = directoryInfo.originalDirectoryId || directoryInfo.documentId  // id thư mục gốc
              elementDoc.inheritDirectoryId = [...directoryInfo.inheritDirectoryId, directoryInfo.documentId] // các cấp thư mục cha
            } else {
              elementDoc.originalDirectoryId = directoryInfo.originalDirectoryId || directoryInfo.documentId // id thư mục gốc
              // Thiết lập lại các cấp thư mục cha
              const indexOf = elementDoc.inheritDirectoryId.indexOf(documentInfo.documentId)
              // console.log('indexOf : ', indexOf)
              const inheritDirectoryId = [...documentInfo.inheritDirectoryId, directoryInfo.documentId, ...elementDoc.inheritDirectoryId.slice(indexOf)]

              elementDoc.inheritDirectoryId = inheritDirectoryId
            }
            await elementDoc.save()
          }
          // Lấy các chia sẻ của destDirectoryId (các chia sẻ tồn tại)
          const shareDestDirectory = await shareDocuments.findAll({
            where: {
              documentId: directoryInfo.documentId,
              enable: true,
            },
          });
          var listShareDoc = []; // các bản ghi chia sẻ cần thêm
          // Duyệt từng bản ghi đã chia sẻ
          for (let index = 0; index < shareDestDirectory.length; index++) {
            const a = shareDestDirectory[index];
            var shareIdsDocument = [] // các bản ghi chia sẻ cần cập nhật
            // Không thêm bản ghi chia sẻ cho chính mình
            if (userId !== a.shareUserId) {
              // Duyệt từng document trong listDocs xem đã được chia sẻ với a.shareUserId hay chưa?
              for (let x = 0; x < listDocs.length; x++) {
                const b = listDocs[x];
                const shareUserId = await shareDocuments.findOne({
                  where: {
                    documentId: b.documentId,
                    shareUserId: a.shareUserId,
                    // permissionId,
                    // enable: true,
                  },
                });
                if (shareUserId) {
                  if (a.permissionId !== b.permissionId) {
                    // Sửa quyền chia sẻ
                    shareIdsDocument.push(b.id)
                  } else {
                    // Khôi phục quyền chia sẻ
                    if (!b.enable) {
                      shareIdsDocument.push(b.id)
                    }
                  }
                } else {
                  // Chưa được chia sẻ với a.shareUserId
                  listShareDoc.push({
                    documentId: b.documentId,
                    ownerId: b.ownerId,
                    permissionId: a.permissionId,
                    shareUserId: a.shareUserId,
                  });
                }
              }
              // Cập nhật lại enable = true,permissionId = permissionId nếu là khôi phục chia sẻ/ chỉnh sửa quyền
              await shareDocuments.update({
                enable: true,
                permissionId: a.permissionId,
                sharedAt: new Date()
              }, {
                where: {
                  id: {
                    [Op.in]: shareIdsDocument, // Id của các bản ghi chia sẻ cần khôi phục/ sửa quyền chia sẻ
                  },
                },
              });
            }
          }
          // Thêm mới các bản ghi đối với listShareDoc
          await shareDocuments.bulkCreate(listShareDoc);
          // Ghi log
          await logAction(ACTION_TYPE.DOC_ACTION.MOVE_DOC, {
            ownerId: userId,
            ipAddress: req.ip,
            visible: true,
            documentId: documentInfo.documentId,
            description: `Di chuyển văn bản "${documentInfo.displayName}" thành công`,
          });
        }
        return res.send(onSuccess({}));
      }
      return res.send(onError(404, "Không tìm thấy văn bản di chuyển"));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API dowload file/thư mục
  // Chỉ được download khi là chủ sở hữu file/ được chia sẻ
  downloadDocument: async (req, res) => {
    const { userId } = req.user;
    try {
      const { documentId } = req.params;
      // Lấy thông tin document theo documentId
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
        },
        include: {
          model: typeOfFile,
          as: "typeOfFile",
        },
      });
      if (!documentInfo)
        // Ghi log
        // await logAction(ACTION_TYPE.DOC_ACTION.DOWNLOAD_DOC, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: "Không tìm thấy file/thư mục",
        // });
        return res.send(onError(404, "Không tìm thấy file/thư mục"));

      if (documentInfo.ownerId !== userId) {
        // Kiểm tra xem document có được chia sẻ với userId hay không?
        const shareDocInfo = await shareDocuments.findOne({
          where: {
            documentId,
            shareUserId: userId,
            enable: true,
          },
        });
        if (!shareDocInfo)
          // await logAction(ACTION_TYPE.DOC_ACTION.DOWNLOAD_DOC, {
          //   ownerId: userId,
          //   ipAddress: req.ip,
          //   visible: true,
          //   description: "Tài khoản không được phép thực hiện",
          // });
          return res.send(onError(403, "Tài khoản không được phép thực hiện"));
      }
      let docDownloadUrl = "";
      // Kiểm tra document là file hay thư mục
      if (documentInfo.directory) {
        // Lấy tất cả các file/thư mục con + thư mục gốc của documentId
        const listDocuments = await documents.findAll({
          where: {
            inheritDirectoryId: {
              [Op.contains]: documentId, // file/thư mục con của documentId
            },
            enable: true, // Không bị xoá
          },
          order: [["createdDate", "ASC"]],
          include: {
            model: typeOfFile,
            as: "typeOfFile",
          },
        });
        const pathDocDownload = `${USER_UPLOAD_DOCS}/${documentInfo.ownerId}`;
        // Tạo một thư mục rỗng với tên = tên thư mục CSDL + timestamp
        const timestamp = Math.floor(new Date().getTime() / 1000);
        const pathDirZip = `${CACHE_DOCS}/${documentInfo.displayName}-${timestamp}`;
        // Tạo thư mục gốc chứa thư mục nén
        const pathDirOriginal = mkdirDoc(pathDirZip);
        // Tạo thư mục cha chứa các file/thư mục
        const pathDirParnet = mkdirDoc(
          pathDirOriginal + `/${documentInfo.displayName}-${timestamp}`
        );
        // Tạo một object chứa lần lượt id, đường dẫn thư mục
        const listPathDir = {};
        listPathDir[documentId] = {
          path: pathDirParnet,
        };
        listDocuments.forEach(async (e) => {
          if (e.directory) {
            // Kiểm tra parentDirectoryId và tạo thư mục con của parentDirectoryId
            listPathDir[e.documentId] = {
              path: mkdirDoc(
                `${listPathDir[e.parentDirectoryId].path}/${e.displayName}`
              ),
            };
          } else {
            // Copy file vào trong thư mục parentDirectoryId
            fs.copyFileSync(
              `${pathDocDownload}/${e.documentId}${e.typeOfFile.displayName}`,
              `${listPathDir[e.parentDirectoryId].path}/${e.displayName}`
            );
          }
        });
        // Nén thư mục gốc lại thành tệp .zip
        await zip(pathDirOriginal, pathDirOriginal + `.zip`, {
          compression: COMPRESSION_LEVEL.high,
        });
        docDownloadUrl = pathDirOriginal + `.zip`;
        // Xoá thư mục vừa tạo
        fs.rmSync(pathDirOriginal, { recursive: true, force: true });
        // Tạo url tải xuống
        res.download(docDownloadUrl, async function (err) {
          if (err) {
            return res.send(onError(500, err));
          }
          // Xoá tệp đã nén
          fs.rmSync(docDownloadUrl, { recursive: true, force: true });
          await logAction(ACTION_TYPE.DOC_ACTION.DOWNLOAD_DOC, {
            ownerId: userId,
            ipAddress: req.ip,
            visible: true,
            documentId: documentId,
            description: `Tải thư mục '${documentInfo.displayName}' xuống thành công`,
          });
        });
      } else {
        docDownloadUrl = `${USER_UPLOAD_DOCS}/${documentInfo.ownerId}/${documentInfo.documentId}${documentInfo.typeOfFile.displayName}`;
        // Tạo url tải xuống
        res.download(
          docDownloadUrl,
          `${documentInfo.displayName}`,
          async function (err) {
            if (err) {
              return res.send(onError(500, err));
            }
            await logAction(ACTION_TYPE.DOC_ACTION.DOWNLOAD_DOC, {
              ownerId: userId,
              ipAddress: req.ip,
              documentId: documentId,
              visible: true,
              description: `Tải file "${documentInfo.displayName}" xuống thành công`,
            });
          }
        );
      }
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.DOWNLOAD_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API copy, tạo bản sao văn bản
  copyDoc: async (req, res) => {
    const { userId } = req.user;
    try {
      const { documentId } = req.body
      const userCurrent = await users.findOne({
        where: { userId },
      });
      if (userCurrent) {
        const docCopyInfo = await documents.findOne({
          where: {
            documentId,
            enable: true,
            recycleBin: false
          },
          include: {
            model: typeOfFile,
            as: "typeOfFile",
          },
        })
        if (docCopyInfo) {
          const userCapacity = userCurrent.capacity;
          // Dung lượng mà user đã sử dụng
          const usageStorage = userCurrent.usageStorage;
          // Kiểm tra khả năng lưu file hiện tại của folder
          if (userCapacity >= docCopyInfo.sizeOfFileOnDisk + usageStorage) {
            // Lấy thông tin thư mục cha của docCopyInfo
            const dirParent = await documents.findOne({
              where: {
                documentId: docCopyInfo.parentDirectoryId,
                directory: true,
                enable: true,
                recycleBin: false
              },
            });
            if (dirParent.ownerId !== userId) {
              // Kiểm tra dirParent hiện tại có được chia sẻ với userId hay không?
              const resultShare = await shareDocuments.findOne({
                where: {
                  shareUserId: userId,
                  documentId: dirParent.documentId,
                  enable: true,
                },
              });
              if (
                !resultShare ||
                resultShare.permission !== PERMISSION.WRITE
              ) {
                // await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
                //   ownerId: userId,
                //   ipAddress: req.ip,
                //   visible: true,
                //   description: `Thư mục không được chia sẻ với ${userId} hoặc ${userId} không có quyền thao thác trên thư mục ${inParentDirId}`,
                // });
                return res.send(onError(403, "Tài khoản không có quyền!"));
              }
            }
            // Hash documentId
            const documentIdCopy = hashesID(docCopyInfo.displayName);
            // Copy file trên ổ đĩa, lấy tên là documentId
            fs.copyFileSync(
              `${USER_UPLOAD_DOCS}/${userId}/${docCopyInfo.documentId}${docCopyInfo.typeOfFile.displayName}`,
              `${USER_UPLOAD_DOCS}/${userId}/${documentIdCopy}${docCopyInfo.typeOfFile.displayName}`
            );
            // Lấy các thông tin khác
            const fileCopy = {
              documentId: documentIdCopy,
              ownerId: userId,
              parentDirectoryId: docCopyInfo.parentDirectoryId,
              displayName: `Bản sao ${docCopyInfo.numberOfCopies === 0 ? "" : `(${docCopyInfo.numberOfCopies + 1})`} của ${docCopyInfo.displayName}`,
              inheritDirectoryId: docCopyInfo.inheritDirectoryId,
              originalDirectoryId: docCopyInfo.originalDirectoryId,
              enable: true,
              typeOfFileId: docCopyInfo.typeOfFileId,
              sizeOfFile: docCopyInfo.sizeOfFile,
              sizeOfFileOnDisk: docCopyInfo.sizeOfFileOnDisk,
              directory: false,
              content: docCopyInfo.content,
              description: docCopyInfo.description,
              keywords: docCopyInfo.keywords,
              numberOfCopies: docCopyInfo.numberOfCopies + 1
            };
            const newfileCopy = await documents.create(fileCopy);
            // Cập nhật thông tin của usageStorage của user
            userCurrent.usageStorage =
              userCurrent.usageStorage + docCopyInfo.sizeOfFileOnDisk;
            await userCurrent.save();
            // Kiểm tra xem thư mục cha có được chia sẻ cho userId hoặc listUserId nào không?
            const listShareUserId = await shareDocuments.findAll({
              where: {
                documentId: dirParent.documentId,
                enable: true,
              },
            });
            if (listShareUserId && listShareUserId.length !== 0) {
              // Tạo các bản ghi chia sẻ cho newDirectory
              var listShareDoc = [];
              listShareUserId.forEach((e) => {
                listShareDoc.push({
                  documentId: fileCopy.documentId,
                  ownerId: fileCopy.ownerId,
                  permissionId: e.permissionId,
                  shareUserId: e.shareUserId,
                });
              });
              // Lưu thông tin chia sẻ vào CSDL
              await shareDocuments.bulkCreate(listShareDoc);
              // Cập nhật trang thái share của fileCopy
              newfileCopy.share = true;
              await newfileCopy.save();
            }
            await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
              ownerId: userId,
              ipAddress: req.ip,
              visible: true,
              description: `Tạo bản sao "${docCopyInfo.displayName}" thành công`,
            });
            return res.send(onSuccess({}));
          }
          // await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
          //   ownerId: userId,
          //   ipAddress: req.ip,
          //   visible: true,
          //   description: "Hết dung lượng lưu trữ.",
          // });
          return res.send(onError(411, "Hết dung lượng lưu trữ"));
        }
        // await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
        //   ownerId: userId,
        //   ipAddress: req.ip,
        //   visible: true,
        //   description: `Tệp không tồn tại!`,
        // });
        return res.send(
          onError(404, `Tệp không tồn tại!`)
        );
      }
      // await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: true,
      //   description: `Tài khoản ${userId} không tồn tại.`,
      // });
      return res.send(onError(403, `Tài khoản ${userId} không tồn tại.`));
    } catch (error) {
      // await logAction(ACTION_TYPE.DOC_ACTION.COPY_DOC, {
      //   ownerId: userId,
      //   ipAddress: req.ip,
      //   visible: false,
      //   description: error.message,
      // });
      return res.send(onError(500, error));
    }
  },
  // API lấy thông tin của các thư mục cha của documentId
  getBreadcrumb: async (req, res) => {
    try {
      const { userId } = req.user;
      const { documentId } = req.params
      const { shareRouter = false } = req.query
      const shareRouterQuery = JSON.parse(shareRouter);
      const path = shareRouterQuery ? 'docs-share' : 'docs'
      // Lấy thông tin document theo documentId
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
          recycleBin: false
        },
        include: {
          model: shareDocuments,
          as: "shareDocuments",
          required: false,
          where: {
            shareUserId: userId,
            enable: true
          }
        }
      });
      if (documentInfo && (documentInfo.ownerId === userId || documentInfo.shareDocuments.length !== 0)) {
        const listDocs = await documents.findAll({
          where: {
            documentId: {
              [Op.in]: documentInfo.inheritDirectoryId, // Lấy các thư mục cha
            },
            enable: true,
            recycleBin: false
          },
          include: {
            model: shareDocuments,
            as: "shareDocuments",
            required: false,
            where: {
              shareUserId: userId,
              enable: true
            }
          },
          order: [["createdDate", "ASC"]],
        })
        const breadcrumb = []
        listDocs.forEach(e => {
          if ((e.ownerId === userId || e.shareDocuments.length !== 0) && e.displayName) {
            // Thêm đường dẫn cho thư mục cha
            breadcrumb.push({
              path: `/${path}/folder/${e.documentId}`,
              breadcrumbName: e.displayName
            })
          }
        });
        // Thêm đường dẫn cho documentInfo
        if (documentInfo.displayName) {
          breadcrumb.push({
            path: `/${path}/folder/${documentInfo.documentId}`,
            breadcrumbName: documentInfo.displayName
          })
        }
        return res.send(onSuccess(breadcrumb));
      }
      // await logAction(ACTION_TYPE.GET, {
      //   ownerId: userId,
      //   description: `Tệp không tồn tại!`,
      // });
      return res.send(onError(404, `Tệp không tồn tại!`));
    } catch (error) {
      return res.send(onError(500, error));
    }
  },
  // API hiển thi nội dung xem trước file
  preview: async (req, res) => {
    try {
      const { documentId } = req.params;
      //Lấy thông tin của document theo documentId
      const documentInfo = await documents.findOne({
        where: {
          documentId,
          enable: true,
        },
        include: {
          model: typeOfFile,
          as: "typeOfFile"
        }
      });
      // if(!documentInfo){
      //   //Ghi log
      //   await logAction(ACTION_TYPE.EDIT, {
      //     ownerId: userId,
      //     description: "Không tìm thấy file/thư mục",
      //   });
      //   return res.send(onError(404, "Không tìm thấy file/thư mục"))
      // }

      // if(documentInfo.ownerId !== userId){
      //   // Kiểm tra xem document có được chia sẻ với userId hay không?
      //   const shareDocInfo = await shareDocuments.findOne({
      //     where: {
      //       documentId,
      //       shareUserId: userId,
      //       enable: true
      //     }
      //   });
      //   if(!shareDocInfo){
      //     await logAction(ACTION_TYPE.DELETE,{
      //       ownerId: userId,
      //       description: "Tài khoản không được phép thực hiện",
      //     });
      //     return res.send(onError(403,"Tài khoản không được phép thực hiện"))
      //   }
      // }
      let docDownloadUrl = `${documentInfo.ownerId}/${documentInfo.documentId}${documentInfo.typeOfFile.displayName}`;


      return res.sendFile(docDownloadUrl, { root: USER_UPLOAD_DOCS })
    } catch (error) {

    }
  }
}
