const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('multiDoc', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    clusterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clusterMultiDoc',
        key: 'clusterId'
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
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'multiDoc',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "multidoc_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "multidoc_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
