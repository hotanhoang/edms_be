const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('nation', {
    nationId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
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
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'nation',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "nation_nationid_uindex",
        unique: true,
        fields: [
          { name: "nationId" },
        ]
      },
      {
        name: "nation_pk",
        unique: true,
        fields: [
          { name: "nationId" },
        ]
      },
    ]
  });
};
