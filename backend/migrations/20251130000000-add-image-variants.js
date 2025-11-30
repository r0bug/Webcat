'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('item_images', 'variants', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON string containing paths to image variants'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('item_images', 'variants');
  }
};