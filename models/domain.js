const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('domain', {
    domainId: {
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
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'domain',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "domain_domainid_uindex",
        unique: true,
        fields: [
          { name: "domainId" },
        ]
      },
      {
        name: "domain_pk",
        unique: true,
        fields: [
          { name: "domainId" },
        ]
      },
    ]
  });
};
