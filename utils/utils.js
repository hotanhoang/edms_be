const logger = require("./logger");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const {
  JWT_SECRET_KEY_ACCESS,
  JWT_SECRET_KEY_REFRESH,
} = require("./constants");
const { users, group } = require("../models/init-models");

module.exports = {
  nonAccentVietnamese(str) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
  },

  hashMd5file(path) {
    return new Promise(function (resolve) {
      var md5sum = crypto.createHash('md5')
      var s = fs.ReadStream(path);
      s.on('data', function (d) {
        md5sum.update(d);
      });
      s.on('end', function () {
        var d = md5sum.digest('hex');
        resolve(d)
      });
    });
  },

  onError(code, message, data) {
    logger.error(message);
    return {
      code,
      status: 0,
      message,
      data,
    };
  },

  onSuccess(data) {
    return {
      code: 200,
      status: 1,
      message: "Ok",
      data,
    };
  },


  async onDataStatisticFormat(data) {
    // console.log("data: ", data)
    let item = {}

    const userInfo = await group.findOne({
      where: {
        groupId: Object.keys(data)[0]
      },
      attributes: ["displayName"]
    })
    item["displayName"] = userInfo.displayName;
    const value = Object.values(data)[0];
    for (let index = 0; index < value.length; index++) {
      const action = value[index].dataValues.action;
      const count = parseInt(value[index].dataValues.value);
      item[action] = count
    }
    return item
  },
  async _onDataStatisticFormat(data) {
    let item = {}

    const userInfo = await users.findOne({
      where: {
        userId: Object.keys(data)[0]
      },
      attributes: ["displayName"]
    })
    item["displayName"] = userInfo.displayName;
    const value = Object.values(data)[0];
    for (let index = 0; index < value.length; index++) {
      const action = value[index].dataValues.action;
      const count = parseInt(value[index].dataValues.value);
      item[action] = count
    }
    return item
  },
  onDataDocFormat(docInfo) {
    // const { inheritDirectoryId, keywords, originalDirectoryId, parentDirectoryId, owner, enable, ...documentInfo } = docInfo
    // return { ...documentInfo, ownerName: owner.displayName }
    // Định dạng các quyền chia sẻ của doc
    const permissionIds = []
    if (docInfo.shareDocuments && docInfo.shareDocuments.length !== 0) {
      docInfo.shareDocuments.forEach(element => {
        permissionIds.push(element.permissionId)
      });
    }
    return {
      content: docInfo.content,
      createdDate: docInfo.createdDate,
      description: docInfo.description,
      directory: docInfo.directory,
      displayName: docInfo.displayName,
      documentId: docInfo.documentId,
      parentDirectoryId: docInfo.parentDirectoryId,
      originalDirectoryId: docInfo.originalDirectoryId,
      lastAccess: docInfo.lastAccess,
      lastModify: docInfo.lastModify,
      ownerId: docInfo.ownerId,
      ownerName: docInfo.owner.displayName,
      ownerAvatar: docInfo.owner.avatar,
      recycleBin: docInfo.recycleBin,
      sizeOfFile: docInfo.sizeOfFile,
      sizeOfFileOnDisk: docInfo.sizeOfFileOnDisk,
      typeOfFileId: docInfo.typeOfFileId,
      typeOfFileName: docInfo.typeOfFile?.displayName,
      share: docInfo.shareDocuments && docInfo.shareDocuments.length !== 0,
      // share: docInfo.share,
      permissionIdShare: permissionIds
    }
  },

  onDataUserFormat(userInfo) {
    return {
      userId: userInfo.userId,
      username: userInfo.username,
      displayName: userInfo.displayName,
      lastAccess: userInfo.lastAccess,
      status: userInfo.enable
        ? userInfo.countLoginFail >= 3
          ? "lock"
          : "active"
        : "lock",
      groupDisplay: userInfo.group_group?.displayName,
      groupId: userInfo.group_group?.groupId,
      posDisplay: userInfo.po?.displayName,
      posId: userInfo.po?.posId,
      roleId: userInfo.roleId,
      capacity: userInfo.capacity / 1000000,
      usageStorage: userInfo.usageStorage / 1000000,
      email: userInfo.email,
      phone: userInfo.phone,
      avatar: userInfo.avatar,
      birthday: userInfo.birthday,
      rolePosId: userInfo.po?.rolePosId,
      parentGroupId: userInfo.group_group?.parentGroupId
    };
  },
  onDataManagementPersonFormat(userInfo) {
    return {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      roleId: userInfo.roleId,
      posId: userInfo.posId,
      positionName: userInfo?.po.displayName,
      rolePosId: userInfo?.po.rolePosId,
      groupId: userInfo.groupId,
      listGroupManaged: userInfo.listGroupManaged,
      listGroupIdManaged: userInfo.listGroupIdManaged,
      listUserManaged: userInfo.listUserManaged,
      listUserIdManaged: userInfo.listUserIdManaged,
      managementBy: userInfo.managementBy
    }
  },
  onDataUserShareFormat(userInfo) {
    return {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      avatar: userInfo.avatar,
      groupDisplayName: userInfo.group_group?.displayName,
      posDisplayName: userInfo.po?.displayName,
    }
  },

  onDataUserShareTopicFormat(userInfo) {
    // console.log("userInfo : ", userInfo.shareUser)
    return {
      userId: userInfo.shareUser.userId,
      displayName: userInfo.shareUser.displayName,
      avatar: userInfo.shareUser.avatar,
      // groupDisplayName: userInfo.shareUser.group.displayName,
      // posDisplayName: userInfo.shareUser.po.displayName,
    }
  },

  onDataTopicFormat(topicInfo) {
    return {
      topicId: topicInfo.topicId,
      displayName: topicInfo.displayName,
      description: topicInfo.description,
      createdDate: topicInfo.createdDate,
      domainDisplayName: topicInfo.domain?.displayName,
      domainId: topicInfo.domainId,
      andOrKeywords: topicInfo.andOrKeywords,
      notKeywords: topicInfo.notKeywords,
      ownerId: topicInfo.ownerId,
      ownerName: topicInfo.owner.displayName,
      ownerAvatar: topicInfo.owner.avatar,
      shareTopics: topicInfo.shareTopics,
    }
  },

  onDataEventFormat(eventInfo) {
    return {
      eventId: eventInfo.eventId,
      title: eventInfo.title,
      displayName: eventInfo.displayName,
      description: eventInfo.description,
      createdDate: eventInfo.createdDate,
      andOrKeywords: eventInfo.andOrKeywords,
      notKeywords: eventInfo.notKeywords,
      startTime: eventInfo.startTime,
      endTime: eventInfo.endTime,
      domainDisplayName: eventInfo.domain?.displayName,
      domainId: eventInfo.domainId,
      nationDisplayName: eventInfo.nation?.displayName,
      nationId: eventInfo.nationId,
      areaDisplayName: eventInfo.area?.displayName,
      areaId: eventInfo.areaId,
      ownerId: eventInfo.ownerId,
      ownerName: eventInfo.owner.displayName,
      ownerAvatar: eventInfo.owner.avatar,
      shareEvents: eventInfo.shareEvents,
    }
  },

  onDataTopicShareFormat(shareInfo) {
    return {
      topicId: shareInfo.topic.topicId,
      displayName: shareInfo.topic.displayName,
      description: shareInfo.topic.description,
      createdDate: shareInfo.topic.createdDate,
      domainDisplayName: shareInfo.topic.domain?.displayName,
      domainId: shareInfo.topic.domainId,
      andOrKeywords: shareInfo.topic.andOrKeywords,
      notKeywords: shareInfo.topic.notKeywords,
      ownerId: shareInfo.ownerId,
      ownerName: shareInfo.topic.owner.displayName,
      ownerAvatar: shareInfo.topic.owner.avatar,
      shareTopics: shareInfo.topic.shareTopics,
    }
  },

  onDataEventShareFormat(shareInfo) {
    return {
      eventId: shareInfo.event.topicId,
      displayName: shareInfo.event.displayName,
      andOrKeywords: shareInfo.event.andOrKeywords,
      notKeywords: shareInfo.event.notKeywords,
      description: shareInfo.event.description,
      createdDate: shareInfo.event.createdDate,
      startTime: shareInfo.event.startTime,
      endTime: shareInfo.event.endTime,
      domainDisplayName: shareInfo.event.domain?.displayName,
      domainId: shareInfo.event.domainId,
      areaDisplayName: shareInfo.event.area?.displayName,
      areaId: shareInfo.event.areaId,
      nationDisplayName: shareInfo.event.nation?.displayName,
      nationId: shareInfo.event.nationId,
      ownerId: shareInfo.ownerId,
      ownerName: shareInfo.event.owner.displayName,
      ownerAvatar: shareInfo.event.owner.avatar,
      shareEvents: shareInfo.event.shareEvents,
    }
  },

  onDocSumFormat(docSumInfo) {
    return {
      docSumId: docSumInfo.docSumId,
      displayName: docSumInfo.displayName,
      documentId: docSumInfo.documentId,
      document: docSumInfo.document,
      orginalSumary: docSumInfo.orginalSumary,
      contentSumary: docSumInfo.contentSumary,
      original_text: docSumInfo.original_text,
      percentLong: docSumInfo.percentLong,
      createdDate: docSumInfo.createdDate,
      lastModify: docSumInfo.lastModify,
      topicId: docSumInfo.topic?.topicId,
      topicDisplayName: docSumInfo.topic?.displayName,
      aiCoreId: docSumInfo.mapAlgTypeAI?.ai.aiId,
      aiCoreDisplayName: docSumInfo.mapAlgTypeAI?.ai.displayName,
      typeAIId: docSumInfo.mapAlgTypeAI?.typeAI.typeAIId,
      typeAIDisplayName: docSumInfo.mapAlgTypeAI?.typeAI.displayName,
      algorId: docSumInfo.mapAlgTypeAI?.algor.algorId,
      algorDisplayName: docSumInfo.mapAlgTypeAI?.algor.displayName,
    }
  },

  onMultiDocSumFormat(mutilSumInfo) {
    let cluster = []
    let file = 0
    let clusters = 0
    let summaryType = ""
    let summaryTopic = ""
    let displayNameDoc = ""
    for (let i = 0; i < mutilSumInfo.clusterMultiDocs.length; i++) {
      const e = mutilSumInfo.clusterMultiDocs[i];
      displayNameDoc = e.multiDoc[0]?.document?.displayName
      file += e.multiDoc.length
      if (!e.topic) {
        clusters += 1
      } else {
        summaryTopic += summaryTopic ? `, ${e.topic.displayName}` : `${e.topic.displayName}`
      }
      summaryType = `${e.mapAlgTypeAI?.typeAI.displayName}, ${e.mapAlgTypeAI?.algor.displayName}`
      cluster.push({
        text: e.contentSumary,
        displayName: e.topic ? e.topic.displayName : e.displayName,
        percentLong: e.percentLong,
        topic: e.topic,
        topicId: e.topicId,
        mapAlgTypeAIId: e.mapAlgTypeAIId,
        typeAIId: e.mapAlgTypeAI.typeAIId,
        typeAIDisplayName: e.mapAlgTypeAI?.typeAI.displayName,
        algorId: e.mapAlgTypeAI?.algor.algorId,
        algorDisplayName: e.mapAlgTypeAI?.algor.displayName,
        multiDoc: e.multiDoc.map(a => {
          let type = 1
          if (a.document.typeOfFile.displayName === ".docx") {
            type = 2
          }
          if (a.document.typeOfFile.displayName === ".doc") {
            type = 3
          }
          if (!a.document.enable) {
            type = 0
          }
          return {
            file_type: type,
            inDisplayName: a.document.displayName,
            inDocId: a.documentId,
            orginalSumary: a.document.content,
            enable: a.document.enable,
          }
        }),
      })
    }
    file += mutilSumInfo.IdDocSum.length
    return {
      multiDocSumId: mutilSumInfo.multiDocSumId,
      ownerId: mutilSumInfo.ownerId,
      createdDate: mutilSumInfo.createdDate,
      lastModify: mutilSumInfo.lastModify,
      IdDocSum: mutilSumInfo.IdDocSum, // Danh sach doc chua tom tat
      displayNameDoc : displayNameDoc|| "",
      cluster: cluster, // Thông tin kết quả tóm tắt
      clusters: clusters || undefined, // Số cụm tóm tắt
      file: file, // Só file dùng để tóm tắt
      summaryType: summaryType, // Loại tóm tắt (Kiểu tóm tắt + thuật toán)
      summaryTopic: summaryTopic, // Chuỗi chủ đề tóm tắt
    }
  },

  async checkAuth(req, res, callback) {
    if (auth.length == 0) res.json(this.onError("Token không tồn tại", 403));
    else callback();
  },

  // async getInfoDocument(docID) {
  //   const docInfo = await documents.findOne({
  //     where: {
  //       documentId: docID
  //     }
  //   });
  //   return docInfo;
  // },

  getToken(data, expiresIn) {
    if (expiresIn) {
      return jwt.sign(data, JWT_SECRET_KEY_ACCESS, { expiresIn });
    }
    return jwt.sign(data, JWT_SECRET_KEY_REFRESH);
  },
  // hashesID(string) {
  //   var result = "";
  //   var characters = `${string}abcdefghijklmnopqrstuvwxyz0123456789`;
  //   var charactersLength = characters.length;
  //   for (var i = 0; i < 24; i++) {
  //     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  //   }
  //   return result;
  // },
  salt(a) {
    var result = "";
    var characters = `abcdefghijklmnopqrstuvwxyz0123456789`;
    var charactersLength = characters.length;
    for (var i = 0; i < a; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  hashesID(string) {
    const secondInHex = Math.floor(new Date() / 1000).toString(16);
    const machineId = crypto
      .createHash("md5")
      .update(string)
      .digest("hex")
      .slice(0, 6);
    const processId = process.pid.toString(16).slice(0, 4).padStart(4, "0");
    const counter = process
      .hrtime()[1]
      .toString(16)
      .slice(0, 6)
      .padStart(6, "0");
    return secondInHex + machineId + processId + counter;
  },
};
