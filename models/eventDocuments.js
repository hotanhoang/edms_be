const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('eventDocuments', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'eventId'
      }
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
    }
  }, {
    sequelize,
    tableName: 'eventDocuments',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "eventdocuments_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "eventdocuments_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
