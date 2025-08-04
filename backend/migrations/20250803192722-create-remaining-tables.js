'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create item_images table
    await queryInterface.createTable('item_images', {
      image_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'items',
          key: 'item_id'
        },
        onDelete: 'CASCADE'
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      image_order: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      alt_text: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('item_images', ['item_id', 'image_order'], { unique: true });

    // Create tags table
    await queryInterface.createTable('tags', {
      tag_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tag_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('tags', ['tag_name']);

    // Create item_tags table
    await queryInterface.createTable('item_tags', {
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'items',
          key: 'item_id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'tags',
          key: 'tag_id'
        },
        onDelete: 'CASCADE'
      },
      added_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    // Create messages table
    await queryInterface.createTable('messages', {
      message_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'items',
          key: 'item_id'
        }
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      message_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('messages', ['sender_id']);
    await queryInterface.addIndex('messages', ['recipient_id']);
    await queryInterface.addIndex('messages', ['item_id']);

    // Create forum_posts table
    await queryInterface.createTable('forum_posts', {
      post_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'items',
          key: 'item_id'
        }
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      parent_post_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'forum_posts',
          key: 'post_id'
        }
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('forum_posts', ['item_id']);
    await queryInterface.addIndex('forum_posts', ['user_id']);
    await queryInterface.addIndex('forum_posts', ['parent_post_id']);

    // Create events table
    await queryInterface.createTable('events', {
      event_id: {
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
      event_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('events', ['event_date']);
    await queryInterface.addIndex('events', ['created_by_user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('forum_posts');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('item_tags');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('item_images');
  }
};