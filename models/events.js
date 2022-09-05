const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('events', {
    eventId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    nationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'nation',
        key: 'nationId'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'domain',
        key: 'domainId'
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    share: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'area',
        key: 'areaId'
      }
    },
    andOrKeywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    notKeywords: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'events',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "events_eventid_uindex",
        unique: true,
        fields: [
          { name: "eventId" },
        ]
      },
      {
        name: "events_pk",
        unique: true,
        fields: [
          { name: "eventId" },
        ]
      },
    ]
  });
};
