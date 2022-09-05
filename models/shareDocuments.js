const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('shareDocuments', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    documentId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'documentId'
      }
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    shareUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permisionDocument',
        key: 'permissionId'
      }
    },
    sharedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    rootShare: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'shareDocuments',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sharedocuments_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "sharedocuments_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
