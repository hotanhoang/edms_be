const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('directory', {
    directoryId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentDirectoryId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'directory',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "directory_directoryid_uindex",
        unique: true,
        fields: [
          { name: "directoryId" },
        ]
      },
      {
        name: "directory_pk",
        unique: true,
        fields: [
          { name: "directoryId" },
        ]
      },
    ]
  });
};
