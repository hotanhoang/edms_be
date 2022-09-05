const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sumaryConf', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    sumDocConfId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sumaryDocConf',
        key: 'sumDocConfId'
      }
    },
    sumMultiDocConfId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sumaryMultiDocConf',
        key: 'sumMultiDocConfId'
      }
    },
    updateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    default: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'sumaryConf',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sumaryconf_pk",
        unique: true,
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "sumaryconf_userid_uindex",
        unique: true,
        fields: [
          { name: "userId" },
        ]
      },
    ]
  });
};
