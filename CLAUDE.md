# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebCat is a web-based catalog system for consignment mall members to share larger items stored in a back room. The system is designed with authentication, messaging, calendar functionality, and mobile-responsive design.

## Project Status

Currently, this repository contains only the specification document (WebCat.md). The implementation has not yet begun.

## Key Architecture Decisions

When implementing this system, follow these architectural patterns:

### Database
- Use MySQL or PostgreSQL as specified
- Follow the normalized schema defined in WebCat.md
- Implement proper indexing on frequently queried fields (user_id, item_id, vendor_id, status, tag_name)

### Backend Architecture
- Implement a RESTful API or GraphQL as specified
- Use JWT tokens for authentication with refresh mechanism
- Structure the backend with clear separation:
  - `/api/auth/*` - Authentication endpoints
  - `/api/items/*` - Item catalog management
  - `/api/messages/*` - Messaging system
  - `/api/users/*` - User management
  - `/api/tags/*` - Tag management
  - `/api/events/*` - Calendar events
  - `/api/forum/*` - Forum/discussion posts

### Frontend Structure
- Use React.js or Vue.js for the UI
- Implement as a Progressive Web App (PWA)
- Mobile-first design using Bootstrap or Tailwind CSS
- Key components to implement:
  - Authentication (login/register/password reset)
  - Item catalog (grid view, detail view, search/filter)
  - Image gallery with carousel (up to 6 images per item)
  - Messaging interface
  - Forum/discussion threads
  - Calendar view for events
  - User profile management

### File Storage
- Use local storage for images with Item_ID in the name
- Implement image optimization and lazy loading
- Enforce max 6 images per item constraint

## Latest Updates (August 2025)

### New Features Added:
1. **Theme Editor**: Admin-only visual theme customization with live preview
2. **User Management**: Admin interface for managing users, roles, and permissions
3. **Admin Dashboard**: Central hub for administrative functions
4. **In-App Documentation**: Comprehensive documentation accessible at `/docs`

### Login Credentials:
- **Admin**: admin@webcat.com / password123
- **Staff**: staff@webcat.com / password123
- **Vendor**: john@vendor.com / password123

## Implementation Commands

Once the project is set up, typical commands will be:

### Backend (Node.js/Express suggested)
```bash
npm install              # Install dependencies
npm run dev             # Start development server
npm test                # Run tests
npm run lint            # Run linter
npm run build           # Build for production
npm start               # Start production server
```

### Frontend (React/Vue)
```bash
npm install              # Install dependencies
npm run dev             # Start development server
npm test                # Run tests
npm run lint            # Run linter
npm run build           # Build for production
npm run preview         # Preview production build
```

### Database
```bash
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed development data
npm run db:reset        # Reset database
```

## Security Considerations

When implementing features, ensure:
- Input validation and sanitization on all user inputs
- Parameterized queries to prevent SQL injection
- XSS protection through proper escaping
- Image upload restrictions (file type: jpg/jpeg/png/webp, max size: 5MB)
- Rate limiting on API endpoints
- HTTPS enforcement in production

## User Role Implementation

Implement role-based access control (RBAC) with three user types:
- **Admin**: Full system access
- **Staff**: Can manage all items and events, moderate forum
- **Vendor**: Can only manage their own items, participate in discussions

Check user permissions before allowing actions on items, messages, and events.

## Testing Strategy

Implement tests for:
- Authentication flows (login, register, password reset)
- Item CRUD operations with proper permissions
- Image upload/deletion with constraints
- Messaging between users
- Tag management
- Search and filter functionality
- Mobile responsiveness

## Development Workflow

1. Always check user permissions before implementing endpoints
2. Validate all inputs at both frontend and backend
3. Use database transactions for operations affecting multiple tables
4. Implement proper error handling with meaningful messages
5. Add database indexes for performance on search queries
6. Test mobile functionality alongside desktop implementation
7. Always describe to me your implementation plans and ask me if its ok to procece.
8. Always keep a log of code changes with rationale for easy understanding of workflow
9. Always update documentation after every code change

## Common Issues and Solutions

### Authentication Issues
- If getting 403 Forbidden errors, check that:
  - The JWT token is being sent in the Authorization header
  - The token hasn't expired (tokens expire after 7 days)
  - The user has the correct role (Admin, Staff, or Vendor)
  
### API Response Handling
- The frontend API service (src/services/api.ts) automatically extracts `response.data`
- When using the api service, access data directly: `const data = await api.get('/endpoint')`
- Don't use `response.data` as the data is already extracted
