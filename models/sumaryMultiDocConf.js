const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sumaryMultiDocConf', {
    sumMultiDocConfId: {
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
    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'typeDocSumary',
        key: 'typeId'
      }
    }
  }, {
    sequelize,
    tableName: 'sumaryMultiDocConf',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sumarymultidocconf_pk",
        unique: true,
        fields: [
          { name: "sumMultiDocConfId" },
        ]
      },
      {
        name: "sumarymultidocconf_summultidocconfid_uindex",
        unique: true,
        fields: [
          { name: "sumMultiDocConfId" },
        ]
      },
    ]
  });
};
