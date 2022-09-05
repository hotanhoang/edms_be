const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('activityLogs', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    shareUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    actionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'action',
        key: 'actionId'
      }
    },
    documentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'documentId'
      }
    },
    directoryId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'directory',
        key: 'directoryId'
      }
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'eventId'
      }
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'topic',
        key: 'topicId'
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    visible: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'activityLogs',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "activitylogs_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "activitylogs_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
