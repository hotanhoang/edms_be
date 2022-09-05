const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('action', {
    actionId: {
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
    visible: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'action',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "action_actionid_uindex",
        unique: true,
        fields: [
          { name: "actionId" },
        ]
      },
      {
        name: "action_pk",
        unique: true,
        fields: [
          { name: "actionId" },
        ]
      },
    ]
  });
};
