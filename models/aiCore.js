const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('aiCore', {
    aiId: {
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
    }
  }, {
    sequelize,
    tableName: 'aiCore',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "aicore_aiid_uindex",
        unique: true,
        fields: [
          { name: "aiId" },
        ]
      },
      {
        name: "aicore_pk",
        unique: true,
        fields: [
          { name: "aiId" },
        ]
      },
    ]
  });
};
