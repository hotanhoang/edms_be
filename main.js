const express = require("express");
const app = express();
const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
// const WebSocket = require("ws");
const { Server } = require("socket.io");
const { addClientToUser, removeClient, list_clients, sendNotificationToUser } = require("./utils/notification");

const {
  STATIC_DIR,
  LOG_SERVER,
  PORT,
  JWT_SECRET_KEY_ACCESS,
  USER_UPLOAD_DOCS,
  USER_AVATAR,
  CACHE_DOCS,
  FILE_KEY_TOPIC,
  SOCKET_CONNECTION,
  SOCKET_CONNECTION_PTN,
  NotificationType
} = require("./utils/constants");
const {
  users,
} = require("./models/init-models");
// Tạo thư mục public
global.__basedir = __dirname;
if (!fs.existsSync(__dirname + `/${STATIC_DIR}`)) {
  fs.mkdirSync(__dirname + `/${STATIC_DIR}`);
}
// Thư mục chưa avatar của user
if (!fs.existsSync(__dirname + `/${USER_AVATAR}`)) {
  fs.mkdirSync(__dirname + `/${USER_AVATAR}`);
}
// Tạo thư mục chứa file log
if (!fs.existsSync(__dirname + `/${LOG_SERVER}`)) {
  fs.mkdirSync(__dirname + `/${LOG_SERVER}`);
}
// Tạo thư mục chứa file do người dùng tao/upload
if (!fs.existsSync(__dirname + `/${USER_UPLOAD_DOCS}`)) {
  fs.mkdirSync(__dirname + `/${USER_UPLOAD_DOCS}`);
}
// Tạo thư mục chứa các file tạm
if (!fs.existsSync(__dirname + `/${CACHE_DOCS}`)) {
  fs.mkdirSync(__dirname + `/${CACHE_DOCS}`);
}
// Tạo thư mục chứa các file upload để lấy key word
if (!fs.existsSync(__dirname + `/${FILE_KEY_TOPIC}`)) {
  fs.mkdirSync(__dirname + `/${FILE_KEY_TOPIC}`);
}
// Public 'public' folder to access
app.use(express.static(__dirname + `/${STATIC_DIR}`));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const usersRouter = require("./routes/UsersRouter");
const topicsRouter = require("./routes/TopicsRouter");
const eventsRouter = require("./routes/EventsRouter");
const documentsRouter = require("./routes/DocumentsRouter");
const postionsRouter = require("./routes/PositionsRouter");
const groupsRouter = require("./routes/GroupsRouter");
const areasRouter = require("./routes/AreasRouter");
const domainsRouter = require("./routes/DomainRouter");
const nationsRouter = require("./routes/NationsRouter");
const assignmentRouter = require("./routes/AssignmentRouter");
const sumConfigRouter = require("./routes/SumConfigRouter");
const docSumRouter = require("./routes/DocSumRouter");
const activityLogsRouter = require("./routes/ActivityLogRouter");
const notificationsRouter = require("./routes/NotificationRouter");
const multiSumRouter = require("./routes/MultiSumRouter");
const statisticRouter = require("./routes/StatisticRouter");
const docConfigRouter = require("./routes/DocConfigRouter");

app.use(cors());
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});



const mainRouter = express.Router();
mainRouter.use("/user", usersRouter);
mainRouter.use("/topic", topicsRouter);
mainRouter.use("/event", eventsRouter);
mainRouter.use("/document", documentsRouter);
mainRouter.use("/positions", postionsRouter);
mainRouter.use("/groups", groupsRouter);
mainRouter.use("/areas", areasRouter);
mainRouter.use("/domains", domainsRouter);
mainRouter.use("/nations", nationsRouter);
mainRouter.use("/assignment", assignmentRouter);
mainRouter.use("/summary", sumConfigRouter);
mainRouter.use("/docsum", docSumRouter);
mainRouter.use("/logs", activityLogsRouter);
mainRouter.use("/notifications", notificationsRouter);
mainRouter.use("/multisum", multiSumRouter);
mainRouter.use("/statistic", statisticRouter);
mainRouter.use("/docConfig", docConfigRouter);

// Xác thực người dùng qua accessToken
app.use(function (req, res, next) {
  if (req.headers && req.headers.authorization) {
    jsonwebtoken.verify(
      req.headers.authorization,
      JWT_SECRET_KEY_ACCESS,
      async function (err, user) {
        if (err) {
          req.user = false;
        } else {
          const userInfo = await users.findOne({
            where: {
              userId: user.userId, enable: true
            }
          })
          if (userInfo) {
            req.user = { ...user, enable: true };
          } else {
            req.user = { ...user, enable: false }
          }
        }
        next();
      }
    );
  } else {
    req.user = false;
    next();
  }
});

app.all('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next()
});

app.use((req, res, next) => {
  console.log(req.method + " : " + req.url);
  next();
});

// {
//   cors: {
//     origin: "http://27.71.234.120:5012",
//   },
// }

app.use("/api/", mainRouter);


// io.listen(5012);


let onlineUsers = [];
const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};
// io.use(async (socket, next) => {
//   const token = socket.handshake.auth.token;
//   const userInfomation = await jsonwebtoken.verify(
//     token,
//     JWT_SECRET_KEY_ACCESS,
//     async function (err, user) {
//       if (err) {
//         return false;
//       } else {
//         const userInfo = await users.findOne({
//           where: {
//             userId: user.userId, enable: true
//           }
//         })
//         if (userInfo) return userInfo;
//         return false;
//       }
//     }
//   );
//   if (!userInfomation) {
//     const err = new Error("not authorized");
//     err.data = { content: "Please retry later" }; // additional details
//     next(err);
//   }
//   next()
// })

let server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [SOCKET_CONNECTION, SOCKET_CONNECTION_PTN],
  }
});

io.on("connection", async (socket) => {
  console.log('kết nối thành công')
  socket.on("newUser", (user) => {
    addNewUser(user?.userId, socket.id);
    // console.log("onlineUsers: ", onlineUsers);
  })

  socket.on("sendNotification", ({ senderId, listReceiverId, content }) => {
    listReceiverId.forEach((receiverId) => {
      const receiver = getUser(receiverId);
      // console.log("receiver: ", receiver)
      if (receiver !== undefined) {
        io.to(receiver.socketId).emit("getNotification", {
          senderId,
          content,
        });
      }
    })
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
  socket.on("close", () => {
    removeUser(socket.id);
  });

});

server.listen(PORT, () => {
  // console.log(`Start server in port ${PORT}`);
});
