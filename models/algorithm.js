const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('algorithm', {
    algorId: {
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
    needPercentLong: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    needKeywords: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'algorithm',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "algorithm_algorid_uindex",
        unique: true,
        fields: [
          { name: "algorId" },
        ]
      },
      {
        name: "algorithm_pk",
        unique: true,
        fields: [
          { name: "algorId" },
        ]
      },
    ]
  });
};
