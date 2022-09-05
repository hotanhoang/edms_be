const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notification', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    activityLogId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'activityLogs',
        key: 'id'
      }
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'notification',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "notification_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "notification_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
