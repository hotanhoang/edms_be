const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  database: "edms",
  // database: "edms_test",
  // database: "Edms",
  host: "localhost",
  port: 5432,
  dialect: "postgres",
  username: "postgres",
  password: "edms_server",
  logging: false,
  dialectOptions: {
    "useUTC": false
  },
  timezone: "Asia/Ho_Chi_Minh",
});

module.exports = sequelize;
