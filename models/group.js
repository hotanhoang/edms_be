const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('group', {
    groupId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parentGroupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'group',
        key: 'groupId'
      }
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    posIds: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    managementBy: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'group',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "group_groupid_uindex",
        unique: true,
        fields: [
          { name: "groupId" },
        ]
      },
      {
        name: "group_pk",
        unique: true,
        fields: [
          { name: "groupId" },
        ]
      },
    ]
  });
};
