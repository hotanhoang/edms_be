const RoleTypes = {
  ADMIN: 0,
  USER: 1,
}; //  Quyền vận hành hệ thống
const RolePerform = {
  READ: 0,
  WRITE: 1,
  // DELETE: 2,
}; // Quyền đoc/ ghi/ xoá file/ thư mục
const PaginationConstants = {
  default_size: 20,
  default_index: 1,
};
const TypeOfFile = {
  ".doc": 1,
  ".pdf": 2,
  ".docx": 3,
  ".rtf": 4,
};
const Permission = {
  READ: 0,
  WRITE: 1,
  // DELETE: 2,
};
const coreAISumDoc = {
  SINGLE_SHORT_SUM: 1, // Đơn văn bản ngắn
  SINGLE_LONG_SUM: 2, // Đơn văn bản dài
  MULTI_SUM_DOC: 3, // Đa văn bản
};

module.exports = {
  PORT: 5001,
  PORT_SOCKET: 5111,
  CAPACITY: 2000000,
  TIME_ZONE: 420,
  TIME_ZONE_STRING: "Asia/Ho_Chi_Minh",
  URL_API: 'http://192.168.2.23:8200', // 'http://27.71.234.120:8200',
  URL_API_MARK: 'http://192.168.2.23:2300',
  SOCKET_CONNECTION: 'http://27.71.234.120:5011',
  SOCKET_CONNECTION_PTN: 'http://localhost:5011',
  URL_API_SUMDOC: 'http://192.168.2.25:9999/SingleSum',
  URL_API_MUTILDOC: 'http://192.168.2.25:9988/MultiNew',
  URL_API_ALGOR: 'http://192.168.2.25:9999/SingleSum_test',
  STATIC_DIR: "public",
  LOG_SERVER: "logs",
  CACHE_DOCS: "cache",
  USER_UPLOAD_DOCS: "documents",
  FILE_KEY_TOPIC: "topics",
  USER_AVATAR: "public/images",
  JWT_SECRET_KEY_ACCESS: "access_edms_secret_key@2022",
  JWT_SECRET_KEY_REFRESH: "refresh_edms_secret_key@2022",
  EXPIRES_IN: "30d",
  ROLE_TYPES: RoleTypes,
  PAGINATION_CONSTANTS: PaginationConstants,
  SALT: "hnd7rHkeua1Tqjle",
  ACTION_TYPE: {
    USER_ACTION: {
      LOGIN: 1,
      LOGOUT: 2,
      EDIT_ACCOUNT: 3,
      CREATE_ACCOUNT: 4,
      REMOVE_ACCOUNT: 5,
    },
    TOPIC_ACTION: {
      CREATE_TOPIC: 11,
      EDIT_TOPIC: 12,
      SHARE_TOPIC: 13,
      REMOVE_SHARE_TOPIC: 14,
      REMOVE_TOPIC: 15
    },
    EVENT_ACTION: {
      CREATE_EVENT: 20,
      EDIT_EVENT: 21,
      SHARE_EVENT: 22,
      REMOVE_SHARE_EVENT: 23,
      REMOVE_EVENT: 24,
    },
    DOC_ACTION: {
      CREATE_DOC: 30,
      EDIT_DOC: 31,
      SHARE_DOC: 32,
      REMOVE_SHARE_DOC: 33,
      REMOVE_DOC: 34,
      DOWNLOAD_DOC: 35,
      MOVE_DOC: 36,
      COPY_DOC: 37,
    },
    SUMMARY_ACTION: {
      SUMMARY_SINGLE: 41,
      SUMMARY_MULTIPLE: 42
    },
    CONFIG_ACTION: {
      CHANGE_CONFIG: 51
    },
    ADD: 1,
    EDIT: 2,
    DELETE: 3,
    SHARE: 4,
    LOGIN: 5,
    LOGOUT: 6,
    GET: 7,
  },

  TYPE_OF_FILE: TypeOfFile,
  ROLE_PERFORM: RolePerform,
  PERMISSION: Permission,
  CORE_AI_SUMDOC: coreAISumDoc,
  NotificationType: {
    NOTIFICATION_SHARE_DOC: 'notification_share_doc',
    NOTIFICATION_SHARE_EVENT: 'notification_share_event',
    NOTIFICATION_SHARE_TOPIC: 'notification_share_topic',
  }
};


