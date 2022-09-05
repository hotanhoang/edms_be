const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aiConfig', {
    aiConfigId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    mapAlgTypeAIId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mapAlgTypeAI',
        key: 'mapAlgTypeAIId'
      }
    },
    updateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    default: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    longSum: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'aiConfig',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "aiconfig_aiconfigid_uindex",
        unique: true,
        fields: [
          { name: "aiConfigId" },
        ]
      },
      {
        name: "aiconfig_pk",
        unique: true,
        fields: [
          { name: "aiConfigId" },
        ]
      },
    ]
  });
};
