'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
      item_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'RESTRICT'
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_info: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Available', 'Pending', 'Sold', 'Removed'),
        allowNull: false,
        defaultValue: 'Available'
      },
      date_added: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      url_slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('items', ['vendor_id']);
    await queryInterface.addIndex('items', ['status']);
    await queryInterface.addIndex('items', ['date_added']);
    await queryInterface.addIndex('items', ['url_slug']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('items');
  }
};