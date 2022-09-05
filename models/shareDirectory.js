const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('shareDirectory', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    },
    shareUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'permisionDocument',
        key: 'permissionId'
      }
    },
    sharedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'shareDirectory',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sharedirectory_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "sharedirectory_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
