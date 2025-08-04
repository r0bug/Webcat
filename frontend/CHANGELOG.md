# Frontend Changelog

## [1.0.0] - 2025-08-04

### Social Sharing Features
- Created ShareButton component with dropdown menu
- Share options: Facebook, Twitter, WhatsApp, Email, Copy Link
- Integrated share functionality into:
  - Item cards in catalog
  - Forum post cards
  - Event cards in calendar
- Shows confirmation when link is copied to clipboard

### Calendar/Events UI
- Created calendar components and pages:
  - CalendarPage - Main calendar view with month navigation
  - Calendar - Interactive calendar grid component
  - EventCard - Event display card with details
  - CreateEventForm - Form for creating new events
- Implemented calendar features:
  - Month view with events displayed on dates
  - Calendar/List view toggle
  - Event creation (staff/admin only)
  - Click date to create event on that date
  - Event details modal
  - Upcoming events sidebar
  - Month navigation (previous/next/today)
  - Visual indicators for today and past events
- Added route:
  - `/calendar` - Calendar page
- Custom CSS for calendar styling

### Forum/Discussion UI
- Created forum components and pages:
  - ForumPage - Main forum listing with search and pagination
  - ForumPostPage - Individual thread view with replies
  - ForumPostCard - Thread preview card with metadata
  - ForumReply - Reply component with edit/delete functionality
  - CreatePostForm - Form for new threads and replies
- Implemented forum features:
  - Thread creation with title and content
  - Reply to threads (nested discussions)
  - Edit posts/replies (with permissions)
  - Delete posts/replies (with permissions)
  - Search forum posts
  - View count display
  - Reply count display
  - User role badges (Admin/Staff)
  - Pagination for thread listings
- Added routes:
  - `/forum` - Forum listing page
  - `/forum/post/:id` - Individual thread page

## [1.0.0] - 2025-08-03

### UI Components
- Created responsive layout with navigation and footer
- Implemented authentication components:
  - Login form with validation
  - Registration form with all user fields
  - Password strength requirements
- Built item catalog components:
  - ItemCard for grid display
  - ItemGrid with loading and error states
  - Items browse page with filters and pagination
- Added navigation with user menu and role-based options
- Integrated React Hook Form for form handling
- Added React Icons for UI elements

### Initial Setup
- Created React project with Vite and TypeScript
- Set up React Router for navigation
- Configured React Query for data fetching
- Added Bootstrap for UI components
- Set up Axios with interceptors for API calls
- Created authentication context with JWT support
- Added environment configuration
- Created project directory structure
- Set up basic routing structure

### Dependencies
- React 18 with TypeScript
- React Router DOM for navigation
- React Query for server state management
- Bootstrap & React Bootstrap for UI
- Axios for API calls
- React Hook Form for form handling
- React Icons for icons
- Date-fns for date utilities

### Project Structure
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts (Auth)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles
```

### Routes Configured
- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/items` - Item catalog
- `/items/:slug` - Item detail view
- `/messages` - User messages
- `/forum` - Discussion forum
- `/calendar` - Events calendar
- `/profile` - User profile