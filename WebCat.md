# Consignment Mall Catalog System Specification

## Project Overview
A web-based used product catalog system for consignment mall members to share larger items stored in a back room. The system includes authentication, messaging, calendar functionality, and mobile-responsive design.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    contact_info TEXT,
    phone_number VARCHAR(20),
    yf_vendor_id VARCHAR(50),
    user_type ENUM('Admin', 'Staff', 'Vendor') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Items Table
```sql
CREATE TABLE items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    vendor_id INT NOT NULL,
    location VARCHAR(100),
    contact_info VARCHAR(200),
    status ENUM('Available', 'Pending', 'Sold', 'Removed') DEFAULT 'Available',
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    url_slug VARCHAR(255) UNIQUE,
    view_count INT DEFAULT 0,
    FOREIGN KEY (vendor_id) REFERENCES users(user_id)
);
```

### Item_Images Table
```sql
CREATE TABLE item_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_order TINYINT DEFAULT 1,
    alt_text VARCHAR(200),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    CONSTRAINT max_6_images CHECK (image_order BETWEEN 1 AND 6)
);
```

### Tags Table
```sql
CREATE TABLE tags (
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Item_Tags Table (Many-to-Many)
```sql
CREATE TABLE item_tags (
    item_id INT,
    tag_id INT,
    added_by_user_id INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE,
    FOREIGN KEY (added_by_user_id) REFERENCES users(user_id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(200),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
);
```

### Forum_Posts Table
```sql
CREATE TABLE forum_posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    user_id INT NOT NULL,
    parent_post_id INT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_post_id) REFERENCES forum_posts(post_id)
);
```

### Events Table
```sql
CREATE TABLE events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    created_by_user_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
);
```

## User Roles & Permissions

### Admin
- Full system access
- User management (create, edit, delete accounts)
- Edit/delete any catalog item
- Add/remove tags from any item
- Moderate forum posts
- Create/edit/delete events
- Access to analytics and reports

### Staff
- Edit/delete catalog items
- Add/remove tags from items
- Moderate forum posts
- Create/edit events
- Assist with user issues

### Vendor
- Create/edit/delete their own catalog items
- Add tags to their own items
- Upload images for their items
- Participate in forum discussions
- Send/receive messages
- View calendar events

## Core Features

### Authentication System
- Email/password login
- Password reset functionality
- Session management
- Role-based access control
- Account activation/deactivation

### Catalog Management
- **Item Creation**: Title, description, price, location, contact info
- **Image Upload**: Up to 6 images per item with drag-and-drop interface
- **Tag System**: Auto-suggest existing tags, create new tags
- **Search & Filter**: By tags, price range, vendor, date added
- **Unique URLs**: SEO-friendly URLs for each item (e.g., /item/vintage-oak-dresser-123)

### Gallery Interface
- **Responsive Design**: Optimized for desktop and mobile
- **Grid Layout**: Adjustable grid (2-4 columns on desktop, 1-2 on mobile)
- **Image Carousel**: Swipe-enabled on mobile
- **Quick Actions**: Share, message owner, view details

### Messaging System
- **Direct Messages**: Buyer-to-seller communication
- **Message Threading**: Organized by item/conversation
- **SMS Notifications**: Optional SMS alerts for new messages
- **Email Notifications**: Backup notification system

### Forum/Chat Platform
- **Item Discussions**: Comment threads for each item
- **General Discussions**: Community board for general topics
- **Real-time Updates**: Live chat functionality
- **Moderation Tools**: Flag inappropriate content

### Calendar System
- **Sales Events**: Special sales, clearance events
- **Mall Events**: General consignment mall activities
- **Integration**: Link events to specific items/vendors
- **Reminders**: Email/SMS reminders for upcoming events

### Social Sharing
- **Share Buttons**: Facebook, Twitter, Pinterest, WhatsApp
- **Open Graph Tags**: Rich previews on social media
- **QR Codes**: Generate QR codes for easy mobile sharing
- **Email Sharing**: Send item links via email

## Technical Requirements

### Frontend
- **Framework**: React.js or Vue.js for responsive UI
- **Mobile-First**: Progressive Web App (PWA) capabilities
- **Image Handling**: Lazy loading, image compression, responsive images
- **Offline Support**: Basic browsing when offline

### Backend
- **API**: RESTful API or GraphQL
- **Database**: MySQL or PostgreSQL
- **File Storage**: Cloud storage (AWS S3, Cloudinary) for images
- **Authentication**: JWT tokens with refresh mechanism

### Mobile Optimization
- **Responsive Design**: Bootstrap or Tailwind CSS
- **Touch Gestures**: Swipe, pinch-to-zoom for images
- **Image Upload**: Camera integration, gallery selection
- **Push Notifications**: Web push for messages/events

## Key Relationships

### Primary Relationships
1. **users.user_id** ← **items.vendor_id** (One user can have many items)
2. **items.item_id** ← **item_images.item_id** (One item can have up to 6 images)
3. **items.item_id** ↔ **tags.tag_id** (Many-to-many via item_tags)
4. **users.user_id** ← **messages.sender_id/recipient_id** (User messaging)
5. **items.item_id** ← **messages.item_id** (Messages about specific items)

### Business Rules
- Each item must have at least 1 image, maximum 6 images
- Only item owner, staff, or admin can edit items
- Tags can be added by item owner, staff, or admin
- Vendors can only message about items they're interested in
- Events can be created by staff and admin only
- All users can view calendar events

## API Endpoints (Key Examples)

### Items
- `GET /api/items` - List items with filtering
- `GET /api/items/:slug` - Get single item by URL slug
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Images
- `POST /api/items/:id/images` - Upload images
- `DELETE /api/images/:id` - Delete image
- `PUT /api/images/:id/order` - Reorder images

### Users
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

## Security Considerations
- Input validation and sanitization
- Image upload restrictions (file type, size)
- Rate limiting for API endpoints
- SQL injection prevention
- XSS protection
- HTTPS enforcement
- Regular security audits

## Performance Optimization
- Database indexing on frequently queried fields
- Image optimization and CDN delivery
- Caching strategies for frequently accessed data
- Pagination for large datasets
- Lazy loading for images and content