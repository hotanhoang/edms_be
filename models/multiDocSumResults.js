const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('multiDocSumResults', {
    multiDocSumId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true
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
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    IdDocSum: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    singleSumary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'multiDocSumResults',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "multidocsumresults_multidocsumid_uindex",
        unique: true,
        fields: [
          { name: "multiDocSumId" },
        ]
      },
      {
        name: "multidocsumresults_pk",
        unique: true,
        fields: [
          { name: "multiDocSumId" },
        ]
      },
    ]
  });
};
