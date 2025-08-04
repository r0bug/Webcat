'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create demo users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        user_id: 1,
        name: 'Admin User',
        email: 'admin@webcat.com',
        password_hash: passwordHash,
        user_type: 'Admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        name: 'Staff Member',
        email: 'staff@webcat.com',
        password_hash: passwordHash,
        user_type: 'Staff',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 3,
        name: 'John Vendor',
        email: 'john@vendor.com',
        password_hash: passwordHash,
        contact_info: '123 Main St',
        phone_number: '555-0001',
        yf_vendor_id: 'YF001',
        user_type: 'Vendor',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 4,
        name: 'Jane Seller',
        email: 'jane@seller.com',
        password_hash: passwordHash,
        contact_info: '456 Oak Ave',
        phone_number: '555-0002',
        yf_vendor_id: 'YF002',
        user_type: 'Vendor',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Create demo items
    await queryInterface.bulkInsert('items', [
      {
        item_id: 1,
        title: 'Vintage Oak Dresser',
        description: 'Beautiful antique oak dresser with 6 drawers. Excellent condition.',
        price: 350.00,
        vendor_id: 3,
        location: 'Back Room A-12',
        contact_info: 'Call John at 555-0001',
        status: 'Available',
        url_slug: 'vintage-oak-dresser-1',
        view_count: 0,
        date_added: new Date(),
        updated_at: new Date()
      },
      {
        item_id: 2,
        title: 'Mid-Century Modern Lamp',
        description: 'Stylish lamp from the 1960s. Working condition with original shade.',
        price: 125.00,
        vendor_id: 4,
        location: 'Back Room B-7',
        contact_info: 'Text Jane at 555-0002',
        status: 'Available',
        url_slug: 'mid-century-modern-lamp-2',
        view_count: 0,
        date_added: new Date(),
        updated_at: new Date()
      },
      {
        item_id: 3,
        title: 'Antique China Set',
        description: 'Complete 12-piece china set with gold trim. No chips or cracks.',
        price: 450.00,
        vendor_id: 3,
        location: 'Back Room C-3',
        status: 'Available',
        url_slug: 'antique-china-set-3',
        view_count: 0,
        date_added: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Create demo tags
    await queryInterface.bulkInsert('tags', [
      {
        tag_id: 1,
        tag_name: 'furniture',
        created_at: new Date()
      },
      {
        tag_id: 2,
        tag_name: 'vintage',
        created_at: new Date()
      },
      {
        tag_id: 3,
        tag_name: 'antique',
        created_at: new Date()
      },
      {
        tag_id: 4,
        tag_name: 'lighting',
        created_at: new Date()
      },
      {
        tag_id: 5,
        tag_name: 'china',
        created_at: new Date()
      }
    ], {});

    // Create demo item tags
    await queryInterface.bulkInsert('item_tags', [
      {
        item_id: 1,
        tag_id: 1,
        added_by_user_id: 3,
        added_at: new Date()
      },
      {
        item_id: 1,
        tag_id: 2,
        added_by_user_id: 3,
        added_at: new Date()
      },
      {
        item_id: 1,
        tag_id: 3,
        added_by_user_id: 3,
        added_at: new Date()
      },
      {
        item_id: 2,
        tag_id: 4,
        added_by_user_id: 4,
        added_at: new Date()
      },
      {
        item_id: 2,
        tag_id: 2,
        added_by_user_id: 4,
        added_at: new Date()
      },
      {
        item_id: 3,
        tag_id: 5,
        added_by_user_id: 3,
        added_at: new Date()
      },
      {
        item_id: 3,
        tag_id: 3,
        added_by_user_id: 3,
        added_at: new Date()
      }
    ], {});

    // Create demo events
    await queryInterface.bulkInsert('events', [
      {
        event_id: 1,
        title: 'Spring Clearance Sale',
        description: '50% off selected items in the back room',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        start_time: '10:00:00',
        end_time: '16:00:00',
        location: 'Main Showroom',
        created_by_user_id: 2,
        is_active: true,
        created_at: new Date()
      },
      {
        event_id: 2,
        title: 'Vendor Meeting',
        description: 'Monthly vendor meeting to discuss new policies',
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        start_time: '18:00:00',
        end_time: '19:30:00',
        location: 'Conference Room',
        created_by_user_id: 1,
        is_active: true,
        created_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('item_tags', null, {});
    await queryInterface.bulkDelete('tags', null, {});
    await queryInterface.bulkDelete('items', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};