# Backend Changelog

## [1.0.0] - 2025-08-04

### Social Sharing Features
- Added social sharing capabilities for items, forum posts, and events
- Share to Facebook, Twitter, WhatsApp, Email
- Copy link to clipboard functionality
- Integrated share buttons into item cards, forum posts, and event cards

### Calendar/Events System
- Implemented complete events management functionality:
  - POST /api/events - Create new event (staff, admin only)
  - GET /api/events - List events with filtering by date and pagination
  - GET /api/events/upcoming - Get upcoming events within specified days
  - GET /api/events/calendar/:year/:month - Get events grouped by day for calendar view
  - GET /api/events/:id - View specific event details
  - PUT /api/events/:id - Update event (staff, admin only)
  - DELETE /api/events/:id - Delete event (admin only)
- Date-based filtering (by month, year, upcoming, past)
- Event grouping by day for calendar display
- Time range support (start/end times)
- Location tracking for events
- Active/inactive status management

### Forum/Discussion System
- Implemented complete forum functionality with threaded discussions:
  - POST /api/forum - Create new thread or reply
  - GET /api/forum - List threads with reply counts and pagination
  - GET /api/forum/search - Search forum posts
  - GET /api/forum/popular - Get popular posts by view count
  - GET /api/forum/:id - View specific post (increments view count)
  - PUT /api/forum/:id - Edit post (owner, staff, admin)
  - DELETE /api/forum/:id - Delete post (owner, admin)
- Threaded reply system with parent-child relationships
- View count tracking for posts
- Edit history tracking (isEdited flag)
- Reply count aggregation for thread listings
- Search functionality across titles and content
- Popular posts based on view count and time period

## [1.0.0] - 2025-08-03

### Image Upload System
- Implemented complete image management for items:
  - POST /api/items/:id/images - Upload up to 6 images per item
  - DELETE /api/items/:id/images/:imageId - Delete specific image
  - PUT /api/items/:id/images/reorder - Reorder images
- File validation (JPEG, PNG, WebP only, max 5MB)
- Automatic image order management
- File cleanup on errors and deletion
- Role-based permissions for image management

### Messaging System
- Created user-to-user messaging functionality:
  - POST /api/messages - Send message
  - GET /api/messages - Get inbox/sent messages with pagination
  - GET /api/messages/:id - View specific message (marks as read)
  - PUT /api/messages/:id/read - Mark message as read
  - DELETE /api/messages/:id - Delete message
  - GET /api/messages/thread - Get conversation thread between users
- Messages can be linked to specific items
- Unread message count tracking
- Thread view for conversations

### Item Catalog CRUD Operations
- Implemented full CRUD operations for items with role-based permissions:
  - POST /api/items - Create new item (authenticated users)
  - GET /api/items - List all items with filtering, pagination, and sorting
  - GET /api/items/id/:id - Get item by ID (increments view count)
  - GET /api/items/slug/:slug - Get item by URL slug
  - PUT /api/items/:id - Update item (owner, staff, admin)
  - DELETE /api/items/:id - Soft delete item (owner, admin)
  - GET /api/items/my-items - Get user's own items
- Added comprehensive filtering options:
  - By status, vendor, price range, tags, and search term
  - Sorting by date, price, title, or view count
  - Pagination with configurable page size
- URL slug generation for SEO-friendly URLs

### Tag Management System
- Created tag functionality for item categorization:
  - POST /api/items/:id/tags - Add tags to item
  - DELETE /api/items/:id/tags/:tagId - Remove tag from item
  - GET /api/tags - Get all tags with item counts
  - GET /api/tags/popular - Get most used tags
- Tags are normalized (lowercase) and deduplicated
- Many-to-many relationship tracking who added each tag
- Tag usage statistics for popular tags

### Authentication System
- Implemented JWT-based authentication with access and refresh tokens
- Created authentication endpoints:
  - POST /api/auth/register - User registration with email welcome
  - POST /api/auth/login - User login
  - POST /api/auth/refresh - Refresh access token
  - POST /api/auth/forgot-password - Request password reset
  - POST /api/auth/reset-password - Reset password with token
  - GET /api/auth/me - Get current user profile
  - PUT /api/auth/me - Update user profile
  - POST /api/auth/change-password - Change password
- Added input validation for all auth endpoints
- Implemented rate limiting for security:
  - Auth endpoints: 5 requests per 15 minutes
  - Password reset: 3 requests per hour
- Created email service for welcome and password reset emails
- Added authentication tests

### Database Models and Migrations
- Created Sequelize models for all database tables:
  - User model with password hashing
  - Item model with URL slug generation
  - ItemImage model with order constraint
  - Tag model with normalization
  - ItemTag join table
  - Message model
  - ForumPost model with self-referencing replies
  - Event model
- Set up all model associations and relationships
- Created migration files for all tables with proper indexes
- Added seed file with demo data for testing

### Initial Setup
- Created backend project structure with TypeScript
- Set up Express.js server with security middleware (helmet, cors, compression)
- Configured TypeScript with strict type checking
- Added JWT authentication middleware with role-based access control
- Set up Sequelize ORM for MySQL database connection
- Created error handling middleware
- Added environment configuration with .env.example
- Set up Jest testing framework
- Created NPM scripts for development, testing, and database operations
- Added file upload directory structure
- Implemented basic health check endpoint

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database and constants configuration
│   ├── controllers/    # Route controllers (to be implemented)
│   ├── middleware/     # Auth and error handling middleware
│   ├── models/         # Sequelize models (to be implemented)
│   ├── routes/         # API routes (to be implemented)
│   ├── services/       # Business logic (to be implemented)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Validation utilities
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Server entry point
├── tests/              # Test files
├── uploads/            # Image upload directory
└── dist/               # TypeScript build output
```

### Dependencies
- Express.js with TypeScript
- Sequelize ORM with MySQL driver
- JWT authentication (jsonwebtoken, bcryptjs)
- Security packages (helmet, cors)
- File upload (multer)
- Validation (express-validator)
- Development tools (ts-node-dev, jest, supertest)