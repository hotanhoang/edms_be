const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('typeAI', {
    typeAIId: {
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
    tableName: 'typeAI',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "typeai_pk",
        unique: true,
        fields: [
          { name: "typeAIId" },
        ]
      },
      {
        name: "typeai_typeaiid_uindex",
        unique: true,
        fields: [
          { name: "typeAIId" },
        ]
      },
    ]
  });
};
