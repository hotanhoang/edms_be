const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sumaryDocConf', {
    sumDocConfId: {
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
    tableName: 'sumaryDocConf',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sumarydocconf_pk",
        unique: true,
        fields: [
          { name: "sumDocConfId" },
        ]
      },
      {
        name: "sumarydocconf_sumdocconfid_uindex",
        unique: true,
        fields: [
          { name: "sumDocConfId" },
        ]
      },
    ]
  });
};
