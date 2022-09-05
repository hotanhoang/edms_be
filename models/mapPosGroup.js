const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mapPosGroup', {
    groupId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    posIds: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'mapPosGroup',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mapposgroup_groupid_uindex",
        unique: true,
        fields: [
          { name: "groupId" },
        ]
      },
      {
        name: "mapposgroup_pk",
        unique: true,
        fields: [
          { name: "groupId" },
        ]
      },
    ]
  });
};
