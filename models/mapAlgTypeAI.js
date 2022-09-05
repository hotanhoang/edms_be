const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mapAlgTypeAI', {
    mapAlgTypeAIId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    aiId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'aiCore',
        key: 'aiId'
      }
    },
    typeAIId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'typeAI',
        key: 'typeAIId'
      }
    },
    algorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'algorithm',
        key: 'algorId'
      }
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'mapAlgTypeAI',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mapalgtypeai_id_uindex",
        unique: true,
        fields: [
          { name: "mapAlgTypeAIId" },
        ]
      },
      {
        name: "mapalgtypeai_pk",
        unique: true,
        fields: [
          { name: "mapAlgTypeAIId" },
        ]
      },
    ]
  });
};
