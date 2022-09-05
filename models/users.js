const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING(255),
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
    enable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    roleId: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      references: {
        model: 'role',
        key: 'roleId'
      }
    },
    countLoginFail: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    timeUnlock: {
      type: DataTypes.DATE,
      allowNull: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'group',
        key: 'groupId'
      }
    },
    posId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'position',
        key: 'posId'
      }
    },
    capacity: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 2000000
    },
    usageStorage: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0
    },
    percent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    initUser: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    changePass: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    managementBy: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "users_pk",
        unique: true,
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "users_userid_uindex",
        unique: true,
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "users_username_uindex",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
};
