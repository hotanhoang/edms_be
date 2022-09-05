const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('documents', {
    documentId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    content: {
      type: DataTypes.STRING,
      allowNull: true
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    sizeOfFile: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    typeOfFileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'typeOfFile',
        key: 'typeOfFileId'
      }
    },
    share: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    lastAccess: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastModify: {
      type: DataTypes.DATE,
      allowNull: true
    },
    recycleBin: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    parentDirectoryId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'documentId'
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sizeOfFileOnDisk: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    keywords: {
      type: DataTypes.STRING,
      allowNull: true
    },
    directory: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    inheritDirectoryId: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    originalDirectoryId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'documentId'
      }
    },
    numberOfCopies: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    hashmd5: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'documents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "documents_documentid_uindex",
        unique: true,
        fields: [
          { name: "documentId" },
        ]
      },
      {
        name: "documents_pk",
        unique: true,
        fields: [
          { name: "documentId" },
        ]
      },
    ]
  });
};
