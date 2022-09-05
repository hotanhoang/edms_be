const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('clusterMultiDoc', {
    clusterId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'topic',
        key: 'topicId'
      }
    },
    multiDocSumId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'multiDocSumResults',
        key: 'multiDocSumId'
      }
    },
    contentSumary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    percentLong: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mapAlgTypeAIId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mapAlgTypeAI',
        key: 'mapAlgTypeAIId'
      }
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    original_text: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'clusterMultiDoc',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "clustermultidoc_clusterid_uindex",
        unique: true,
        fields: [
          { name: "clusterId" },
        ]
      },
      {
        name: "clustermultidoc_pk",
        unique: true,
        fields: [
          { name: "clusterId" },
        ]
      },
    ]
  });
};
