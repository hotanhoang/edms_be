const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('typeOfFile', {
    typeOfFileId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'typeOfFile',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "typeoffile_pk",
        unique: true,
        fields: [
          { name: "typeOfFileId" },
        ]
      },
      {
        name: "typeoffile_typeoffileid_uindex",
        unique: true,
        fields: [
          { name: "typeOfFileId" },
        ]
      },
    ]
  });
};
