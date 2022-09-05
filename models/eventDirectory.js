const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eventDirectory', {
    id: {
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
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'eventId'
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
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'eventDirectory',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "eventdirectory_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "eventdirectory_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
