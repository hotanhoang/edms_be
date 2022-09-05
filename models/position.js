const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('position', {
    posId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rolePosId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rolePosition',
        key: 'rolePosId'
      }
    },
    crossGroup: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'position',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "position_pk",
        unique: true,
        fields: [
          { name: "posId" },
        ]
      },
      {
        name: "position_posid_uindex",
        unique: true,
        fields: [
          { name: "posId" },
        ]
      },
    ]
  });
};
