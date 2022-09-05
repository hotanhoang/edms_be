const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('docSumResults', {
    docSumId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    documentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'documentId'
      }
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    orginalSumary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contentSumary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'topic',
        key: 'topicId'
      }
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    percentLong: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    lastModify: {
      type: DataTypes.DATE,
      allowNull: true
    },
    original_text: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'docSumResults',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "docsumresults_docsumid_uindex",
        unique: true,
        fields: [
          { name: "docSumId" },
        ]
      },
      {
        name: "docsumresults_pk",
        unique: true,
        fields: [
          { name: "docSumId" },
        ]
      },
    ]
  });
};
