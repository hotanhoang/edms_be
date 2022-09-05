const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('rolePosition', {
    rolePosId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'rolePosition',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "roleposition_pk",
        unique: true,
        fields: [
          { name: "rolePosId" },
        ]
      },
      {
        name: "roleposition_roleposid_uindex",
        unique: true,
        fields: [
          { name: "rolePosId" },
        ]
      },
    ]
  });
};
