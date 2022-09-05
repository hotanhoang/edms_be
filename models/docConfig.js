const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('docConfig', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    maxCapacity: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    maxFileSize: {
      type: DataTypes.DOUBLE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'docConfig',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "docConfig_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
