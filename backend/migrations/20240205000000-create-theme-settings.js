'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('theme_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      setting_type: {
        type: Sequelize.ENUM('color', 'text', 'number', 'boolean', 'json'),
        allowNull: false,
        defaultValue: 'text'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'general'
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('theme_settings', ['category']);
    await queryInterface.addIndex('theme_settings', ['setting_key']);

    // Insert default theme settings
    await queryInterface.bulkInsert('theme_settings', [
      // Brand Settings
      {
        setting_key: 'site_title',
        setting_value: 'WebCat',
        setting_type: 'text',
        category: 'brand',
        description: 'Main site title',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'site_tagline',
        setting_value: 'Your Consignment Mall Catalog',
        setting_type: 'text',
        category: 'brand',
        description: 'Site tagline or subtitle',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'welcome_message',
        setting_value: 'Welcome to WebCat - Browse our collection of unique items',
        setting_type: 'text',
        category: 'brand',
        description: 'Welcome message on homepage',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Color Settings
      {
        setting_key: 'primary_color',
        setting_value: '#3B82F6',
        setting_type: 'color',
        category: 'colors',
        description: 'Primary brand color',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'secondary_color',
        setting_value: '#6366F1',
        setting_type: 'color',
        category: 'colors',
        description: 'Secondary brand color',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'accent_color',
        setting_value: '#8B5CF6',
        setting_type: 'color',
        category: 'colors',
        description: 'Accent color for highlights',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'background_color',
        setting_value: '#FFFFFF',
        setting_type: 'color',
        category: 'colors',
        description: 'Main background color',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'text_color',
        setting_value: '#1F2937',
        setting_type: 'color',
        category: 'colors',
        description: 'Main text color',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'navbar_bg_color',
        setting_value: '#1F2937',
        setting_type: 'color',
        category: 'colors',
        description: 'Navigation bar background',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'navbar_text_color',
        setting_value: '#FFFFFF',
        setting_type: 'color',
        category: 'colors',
        description: 'Navigation bar text color',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Typography Settings
      {
        setting_key: 'font_family',
        setting_value: 'Inter, system-ui, -apple-system, sans-serif',
        setting_type: 'text',
        category: 'typography',
        description: 'Main font family',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'heading_font_family',
        setting_value: 'Inter, system-ui, -apple-system, sans-serif',
        setting_type: 'text',
        category: 'typography',
        description: 'Heading font family',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'base_font_size',
        setting_value: '16',
        setting_type: 'number',
        category: 'typography',
        description: 'Base font size in pixels',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Layout Settings
      {
        setting_key: 'border_radius',
        setting_value: '8',
        setting_type: 'number',
        category: 'layout',
        description: 'Default border radius in pixels',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'container_max_width',
        setting_value: '1200',
        setting_type: 'number',
        category: 'layout',
        description: 'Maximum container width in pixels',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Feature Settings
      {
        setting_key: 'enable_dark_mode',
        setting_value: 'true',
        setting_type: 'boolean',
        category: 'features',
        description: 'Enable dark mode toggle',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'show_vendor_logos',
        setting_value: 'true',
        setting_type: 'boolean',
        category: 'features',
        description: 'Show vendor logos on items',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('theme_settings');
  }
};