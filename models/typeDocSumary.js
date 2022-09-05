const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('typeDocSumary', {
    typeId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    urlAPI: {
      type: DataTypes.STRING,
      allowNull: true
    },
    multiSumary: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'typeDocSumary',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "typedocsumary_pk",
        unique: true,
        fields: [
          { name: "typeId" },
        ]
      },
      {
        name: "typedocsumary_typeid_uindex",
        unique: true,
        fields: [
          { name: "typeId" },
        ]
      },
    ]
  });
};
