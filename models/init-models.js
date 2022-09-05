var DataTypes = require("sequelize").DataTypes;
var _action = require("./action");
var _activityLogs = require("./activityLogs");
var _aiConfig = require("./aiConfig");
var _aiCore = require("./aiCore");
var _algorithm = require("./algorithm");
var _area = require("./area");
var _clusterMultiDoc = require("./clusterMultiDoc");
var _directory = require("./directory");
var _docConfig = require("./docConfig");
var _docSumResults = require("./docSumResults");
var _documents = require("./documents");
var _domain = require("./domain");
var _eventDirectory = require("./eventDirectory");
var _eventDocuments = require("./eventDocuments");
var _events = require("./events");
var _group = require("./group");
var _mapAlgTypeAI = require("./mapAlgTypeAI");
var _mapPosGroup = require("./mapPosGroup");
var _multiDoc = require("./multiDoc");
var _multiDocSumResults = require("./multiDocSumResults");
var _nation = require("./nation");
var _notification = require("./notification");
var _permisionDocument = require("./permisionDocument");
var _position = require("./position");
var _role = require("./role");
var _rolePosition = require("./rolePosition");
var _shareDirectory = require("./shareDirectory");
var _shareDocuments = require("./shareDocuments");
var _shareEvents = require("./shareEvents");
var _shareTopics = require("./shareTopics");
var _sumaryConf = require("./sumaryConf");
var _sumaryDocConf = require("./sumaryDocConf");
var _sumaryMultiDocConf = require("./sumaryMultiDocConf");
var _topic = require("./topic");
var _typeAI = require("./typeAI");
var _typeDocSumary = require("./typeDocSumary");
var _typeOfFile = require("./typeOfFile");
var _users = require("./users");

function initModels(sequelize) {
  var action = _action(sequelize, DataTypes);
  var activityLogs = _activityLogs(sequelize, DataTypes);
  var aiConfig = _aiConfig(sequelize, DataTypes);
  var aiCore = _aiCore(sequelize, DataTypes);
  var algorithm = _algorithm(sequelize, DataTypes);
  var area = _area(sequelize, DataTypes);
  var clusterMultiDoc = _clusterMultiDoc(sequelize, DataTypes);
  var directory = _directory(sequelize, DataTypes);
  var docConfig = _docConfig(sequelize, DataTypes);
  var docSumResults = _docSumResults(sequelize, DataTypes);
  var documents = _documents(sequelize, DataTypes);
  var domain = _domain(sequelize, DataTypes);
  var eventDirectory = _eventDirectory(sequelize, DataTypes);
  var eventDocuments = _eventDocuments(sequelize, DataTypes);
  var events = _events(sequelize, DataTypes);
  var group = _group(sequelize, DataTypes);
  var mapAlgTypeAI = _mapAlgTypeAI(sequelize, DataTypes);
  var mapPosGroup = _mapPosGroup(sequelize, DataTypes);
  var multiDoc = _multiDoc(sequelize, DataTypes);
  var multiDocSumResults = _multiDocSumResults(sequelize, DataTypes);
  var nation = _nation(sequelize, DataTypes);
  var notification = _notification(sequelize, DataTypes);
  var permisionDocument = _permisionDocument(sequelize, DataTypes);
  var position = _position(sequelize, DataTypes);
  var role = _role(sequelize, DataTypes);
  var rolePosition = _rolePosition(sequelize, DataTypes);
  var shareDirectory = _shareDirectory(sequelize, DataTypes);
  var shareDocuments = _shareDocuments(sequelize, DataTypes);
  var shareEvents = _shareEvents(sequelize, DataTypes);
  var shareTopics = _shareTopics(sequelize, DataTypes);
  var sumaryConf = _sumaryConf(sequelize, DataTypes);
  var sumaryDocConf = _sumaryDocConf(sequelize, DataTypes);
  var sumaryMultiDocConf = _sumaryMultiDocConf(sequelize, DataTypes);
  var topic = _topic(sequelize, DataTypes);
  var typeAI = _typeAI(sequelize, DataTypes);
  var typeDocSumary = _typeDocSumary(sequelize, DataTypes);
  var typeOfFile = _typeOfFile(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  activityLogs.belongsTo(action, { as: "action", foreignKey: "actionId" });
  action.hasMany(activityLogs, { as: "activityLogs", foreignKey: "actionId" });
  notification.belongsTo(activityLogs, { as: "activityLog", foreignKey: "activityLogId" });
  activityLogs.hasMany(notification, { as: "notifications", foreignKey: "activityLogId" });
  mapAlgTypeAI.belongsTo(aiCore, { as: "ai", foreignKey: "aiId" });
  aiCore.hasMany(mapAlgTypeAI, { as: "mapAlgTypeAIs", foreignKey: "aiId" });
  mapAlgTypeAI.belongsTo(algorithm, { as: "algor", foreignKey: "algorId" });
  algorithm.hasMany(mapAlgTypeAI, { as: "mapAlgTypeAIs", foreignKey: "algorId" });
  events.belongsTo(area, { as: "area", foreignKey: "areaId" });
  area.hasMany(events, { as: "events", foreignKey: "areaId" });
  nation.belongsTo(area, { as: "area", foreignKey: "areaId" });
  area.hasMany(nation, { as: "nations", foreignKey: "areaId" });
  multiDoc.belongsTo(clusterMultiDoc, { as: "cluster", foreignKey: "clusterId" });
  clusterMultiDoc.hasMany(multiDoc, { as: "multiDocs", foreignKey: "clusterId" });
  activityLogs.belongsTo(directory, { as: "directory", foreignKey: "directoryId" });
  directory.hasMany(activityLogs, { as: "activityLogs", foreignKey: "directoryId" });
  eventDirectory.belongsTo(directory, { as: "directory", foreignKey: "directoryId" });
  directory.hasMany(eventDirectory, { as: "eventDirectories", foreignKey: "directoryId" });
  shareDirectory.belongsTo(directory, { as: "directory", foreignKey: "directoryId" });
  directory.hasMany(shareDirectory, { as: "shareDirectories", foreignKey: "directoryId" });
  activityLogs.belongsTo(documents, { as: "document", foreignKey: "documentId" });
  documents.hasMany(activityLogs, { as: "activityLogs", foreignKey: "documentId" });
  docSumResults.belongsTo(documents, { as: "document", foreignKey: "documentId" });
  documents.hasMany(docSumResults, { as: "docSumResults", foreignKey: "documentId" });
  documents.belongsTo(documents, { as: "originalDirectory", foreignKey: "originalDirectoryId" });
  documents.hasMany(documents, { as: "documents", foreignKey: "originalDirectoryId" });
  documents.belongsTo(documents, { as: "parentDirectory", foreignKey: "parentDirectoryId" });
  documents.hasMany(documents, { as: "parentDirectory_documents", foreignKey: "parentDirectoryId" });
  eventDocuments.belongsTo(documents, { as: "document", foreignKey: "documentId" });
  documents.hasMany(eventDocuments, { as: "eventDocuments", foreignKey: "documentId" });
  multiDoc.belongsTo(documents, { as: "document", foreignKey: "documentId" });
  documents.hasMany(multiDoc, { as: "multiDocs", foreignKey: "documentId" });
  shareDocuments.belongsTo(documents, { as: "document", foreignKey: "documentId" });
  documents.hasMany(shareDocuments, { as: "shareDocuments", foreignKey: "documentId" });
  events.belongsTo(domain, { as: "domain", foreignKey: "domainId" });
  domain.hasMany(events, { as: "events", foreignKey: "domainId" });
  topic.belongsTo(domain, { as: "domain", foreignKey: "domainId" });
  domain.hasMany(topic, { as: "topics", foreignKey: "domainId" });
  activityLogs.belongsTo(events, { as: "event", foreignKey: "eventId" });
  events.hasMany(activityLogs, { as: "activityLogs", foreignKey: "eventId" });
  eventDirectory.belongsTo(events, { as: "event", foreignKey: "eventId" });
  events.hasMany(eventDirectory, { as: "eventDirectories", foreignKey: "eventId" });
  eventDocuments.belongsTo(events, { as: "event", foreignKey: "eventId" });
  events.hasMany(eventDocuments, { as: "eventDocuments", foreignKey: "eventId" });
  shareEvents.belongsTo(events, { as: "event", foreignKey: "eventId" });
  events.hasMany(shareEvents, { as: "shareEvents", foreignKey: "eventId" });
  group.belongsTo(group, { as: "parentGroup", foreignKey: "parentGroupId" });
  group.hasMany(group, { as: "groups", foreignKey: "parentGroupId" });
  users.belongsTo(group, { as: "group_group", foreignKey: "groupId" });
  group.hasMany(users, { as: "users", foreignKey: "groupId" });
  aiConfig.belongsTo(mapAlgTypeAI, { as: "mapAlgTypeAI", foreignKey: "mapAlgTypeAIId" });
  mapAlgTypeAI.hasMany(aiConfig, { as: "aiConfigs", foreignKey: "mapAlgTypeAIId" });
  clusterMultiDoc.belongsTo(mapAlgTypeAI, { as: "mapAlgTypeAI", foreignKey: "mapAlgTypeAIId" });
  mapAlgTypeAI.hasMany(clusterMultiDoc, { as: "clusterMultiDocs", foreignKey: "mapAlgTypeAIId" });
  docSumResults.belongsTo(mapAlgTypeAI, { as: "mapAlgTypeAI", foreignKey: "mapAlgTypeAIId" });
  mapAlgTypeAI.hasMany(docSumResults, { as: "docSumResults", foreignKey: "mapAlgTypeAIId" });
  clusterMultiDoc.belongsTo(multiDocSumResults, { as: "multiDocSum", foreignKey: "multiDocSumId" });
  multiDocSumResults.hasMany(clusterMultiDoc, { as: "clusterMultiDocs", foreignKey: "multiDocSumId" });
  events.belongsTo(nation, { as: "nation", foreignKey: "nationId" });
  nation.hasMany(events, { as: "events", foreignKey: "nationId" });
  shareDirectory.belongsTo(permisionDocument, { as: "permission", foreignKey: "permissionId" });
  permisionDocument.hasMany(shareDirectory, { as: "shareDirectories", foreignKey: "permissionId" });
  shareDocuments.belongsTo(permisionDocument, { as: "permission", foreignKey: "permissionId" });
  permisionDocument.hasMany(shareDocuments, { as: "shareDocuments", foreignKey: "permissionId" });
  users.belongsTo(position, { as: "po", foreignKey: "posId" });
  position.hasMany(users, { as: "users", foreignKey: "posId" });
  users.belongsTo(role, { as: "role", foreignKey: "roleId" });
  role.hasMany(users, { as: "users", foreignKey: "roleId" });
  position.belongsTo(rolePosition, { as: "rolePo", foreignKey: "rolePosId" });
  rolePosition.hasMany(position, { as: "positions", foreignKey: "rolePosId" });
  sumaryConf.belongsTo(sumaryDocConf, { as: "sumDocConf", foreignKey: "sumDocConfId" });
  sumaryDocConf.hasMany(sumaryConf, { as: "sumaryConfs", foreignKey: "sumDocConfId" });
  sumaryConf.belongsTo(sumaryMultiDocConf, { as: "sumMultiDocConf", foreignKey: "sumMultiDocConfId" });
  sumaryMultiDocConf.hasMany(sumaryConf, { as: "sumaryConfs", foreignKey: "sumMultiDocConfId" });
  activityLogs.belongsTo(topic, { as: "topic", foreignKey: "topicId" });
  topic.hasMany(activityLogs, { as: "activityLogs", foreignKey: "topicId" });
  clusterMultiDoc.belongsTo(topic, { as: "topic", foreignKey: "topicId" });
  topic.hasMany(clusterMultiDoc, { as: "clusterMultiDocs", foreignKey: "topicId" });
  docSumResults.belongsTo(topic, { as: "topic", foreignKey: "topicId" });
  topic.hasMany(docSumResults, { as: "docSumResults", foreignKey: "topicId" });
  shareTopics.belongsTo(topic, { as: "topic", foreignKey: "topicId" });
  topic.hasMany(shareTopics, { as: "shareTopics", foreignKey: "topicId" });
  mapAlgTypeAI.belongsTo(typeAI, { as: "typeAI", foreignKey: "typeAIId" });
  typeAI.hasMany(mapAlgTypeAI, { as: "mapAlgTypeAIs", foreignKey: "typeAIId" });
  sumaryDocConf.belongsTo(typeDocSumary, { as: "type", foreignKey: "typeId" });
  typeDocSumary.hasMany(sumaryDocConf, { as: "sumaryDocConfs", foreignKey: "typeId" });
  sumaryMultiDocConf.belongsTo(typeDocSumary, { as: "type", foreignKey: "typeId" });
  typeDocSumary.hasMany(sumaryMultiDocConf, { as: "sumaryMultiDocConfs", foreignKey: "typeId" });
  documents.belongsTo(typeOfFile, { as: "typeOfFile", foreignKey: "typeOfFileId" });
  typeOfFile.hasMany(documents, { as: "documents", foreignKey: "typeOfFileId" });
  activityLogs.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(activityLogs, { as: "activityLogs", foreignKey: "ownerId" });
  activityLogs.belongsTo(users, { as: "shareUser", foreignKey: "shareUserId" });
  users.hasMany(activityLogs, { as: "shareUser_activityLogs", foreignKey: "shareUserId" });
  aiConfig.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(aiConfig, { as: "aiConfigs", foreignKey: "userId" });
  directory.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(directory, { as: "directories", foreignKey: "ownerId" });
  docSumResults.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(docSumResults, { as: "docSumResults", foreignKey: "ownerId" });
  documents.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(documents, { as: "documents", foreignKey: "ownerId" });
  domain.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(domain, { as: "domains", foreignKey: "userId" });
  eventDirectory.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(eventDirectory, { as: "eventDirectories", foreignKey: "ownerId" });
  eventDocuments.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(eventDocuments, { as: "eventDocuments", foreignKey: "ownerId" });
  events.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(events, { as: "events", foreignKey: "ownerId" });
  group.belongsTo(users, { as: "managementBy_user", foreignKey: "managementBy" });
  users.hasMany(group, { as: "groups", foreignKey: "managementBy" });
  multiDocSumResults.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(multiDocSumResults, { as: "multiDocSumResults", foreignKey: "ownerId" });
  notification.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(notification, { as: "notifications", foreignKey: "userId" });
  shareDirectory.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(shareDirectory, { as: "shareDirectories", foreignKey: "ownerId" });
  shareDirectory.belongsTo(users, { as: "shareUser", foreignKey: "shareUserId" });
  users.hasMany(shareDirectory, { as: "shareUser_shareDirectories", foreignKey: "shareUserId" });
  shareDocuments.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(shareDocuments, { as: "shareDocuments", foreignKey: "ownerId" });
  shareDocuments.belongsTo(users, { as: "shareUser", foreignKey: "shareUserId" });
  users.hasMany(shareDocuments, { as: "shareUser_shareDocuments", foreignKey: "shareUserId" });
  shareEvents.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(shareEvents, { as: "shareEvents", foreignKey: "ownerId" });
  shareEvents.belongsTo(users, { as: "shareUser", foreignKey: "shareUserId" });
  users.hasMany(shareEvents, { as: "shareUser_shareEvents", foreignKey: "shareUserId" });
  shareTopics.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(shareTopics, { as: "shareTopics", foreignKey: "ownerId" });
  shareTopics.belongsTo(users, { as: "shareUser", foreignKey: "shareUserId" });
  users.hasMany(shareTopics, { as: "shareUser_shareTopics", foreignKey: "shareUserId" });
  topic.belongsTo(users, { as: "owner", foreignKey: "ownerId" });
  users.hasMany(topic, { as: "topics", foreignKey: "ownerId" });
  users.belongsTo(users, { as: "managementBy_user", foreignKey: "managementBy" });
  users.hasMany(users, { as: "users", foreignKey: "managementBy" });

  return {
    action,
    activityLogs,
    aiConfig,
    aiCore,
    algorithm,
    area,
    clusterMultiDoc,
    directory,
    docConfig,
    docSumResults,
    documents,
    domain,
    eventDirectory,
    eventDocuments,
    events,
    group,
    mapAlgTypeAI,
    mapPosGroup,
    multiDoc,
    multiDocSumResults,
    nation,
    notification,
    permisionDocument,
    position,
    role,
    rolePosition,
    shareDirectory,
    shareDocuments,
    shareEvents,
    shareTopics,
    sumaryConf,
    sumaryDocConf,
    sumaryMultiDocConf,
    topic,
    typeAI,
    typeDocSumary,
    typeOfFile,
    users,
  };
}
module.exports = initModels(require("../utils/database"));
module.exports.initModels = initModels;
module.exports.default = initModels;
