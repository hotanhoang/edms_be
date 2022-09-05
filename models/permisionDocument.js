const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('permisionDocument', {
    permissionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'permisionDocument',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "permisiondocument_permissionid_uindex",
        unique: true,
        fields: [
          { name: "permissionId" },
        ]
      },
      {
        name: "permisiondocument_pk",
        unique: true,
        fields: [
          { name: "permissionId" },
        ]
      },
    ]
  });
};
