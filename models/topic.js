const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topic', {
    topicId: {
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
    createdDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'domain',
        key: 'domainId'
      }
    },
    andOrKeywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    notKeywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    auto: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'topic',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "topic_pk",
        unique: true,
        fields: [
          { name: "topicId" },
        ]
      },
      {
        name: "topic_topicid_uindex",
        unique: true,
        fields: [
          { name: "topicId" },
        ]
      },
    ]
  });
};
