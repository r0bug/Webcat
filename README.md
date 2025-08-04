# WebCat - Consignment Mall Catalog System

WebCat is a web-based catalog system designed for consignment mall members to share and manage larger items stored in a back room. The system features authentication, item catalog management, messaging between users, forum discussions, event calendar, and social sharing capabilities.

## Features

### Core Features
- **User Authentication**: JWT-based authentication with role-based access control (Admin, Staff, Vendor)
- **Item Catalog**: Browse, search, and filter items with image galleries (up to 6 images per item)
- **Tag System**: Categorize items with tags for better organization
- **Messaging System**: User-to-user messaging with thread support
- **Discussion Forum**: Threaded discussions with edit/delete capabilities
- **Event Calendar**: Monthly calendar view for mall events
- **Social Sharing**: Share items, forum posts, and events on social media
- **Mobile Responsive**: Progressive Web App with mobile-first design

### Admin Features
- **Theme Editor**: Visual theme customization with live preview
- **User Management**: Create, edit, and manage user accounts
- **Admin Dashboard**: Central hub for administrative functions
- **In-App Documentation**: Comprehensive documentation at `/docs`

### User Roles
- **Admin**: Full system access, can manage all content
- **Staff**: Can manage all items and events, moderate forum
- **Vendor**: Can manage their own items, participate in discussions

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript for type safety
- Sequelize ORM with MySQL
- JWT authentication
- Multer for file uploads
- Express Validator for input validation

### Frontend
- React with TypeScript
- Vite for fast development
- React Router for navigation
- React Query for server state management
- Bootstrap for responsive UI
- React Hook Form for form handling

## Installation

### Prerequisites
- Node.js 16+ and npm
- MySQL 5.7+ or 8.0+

### Quick Installation

1. Clone the repository:
```bash
git clone https://github.com/r0bug/Webcat.git
cd Webcat
```

2. Run the installation script:
```bash
chmod +x install.sh
./install.sh
```

The installation script will:
- Check system requirements
- Install dependencies for both backend and frontend
- Create `.env` files with default configurations
- Set up the database (if MySQL is available)
- Create startup scripts

3. Configure the database:
Edit `backend/.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

4. Start the application:

**Option A - Default ports:**
```bash
./start.sh
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

**Option B - Port 80 (requires sudo):**
```bash
./start-webcat-80.sh
```
- Frontend: http://localhost
- Backend API: http://localhost:3001/api

**Option C - WebCat script:**
```bash
./start-webcat.sh
```
Starts both frontend and backend in development mode

## Default Credentials

After seeding the database, you can login with:
- **Admin**: admin@webcat.com / password123
- **Staff**: staff@webcat.com / password123
- **Vendor**: vendor@webcat.com / password123

## Manual Installation

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit with your database credentials
npm run build
npm run db:migrate
npm run db:seed  # Optional: add sample data
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Edit if needed
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Item Endpoints
- `GET /api/items` - List items with filtering and pagination
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Soft delete item
- `POST /api/items/:id/images` - Upload item images
- `DELETE /api/items/:id/images/:imageId` - Delete item image

### Other Endpoints
- Tag management: `/api/tags/*`
- Messaging: `/api/messages/*`
- Forum: `/api/forum/*`
- Events: `/api/events/*`

## Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript
npm run test       # Run tests
npm run lint       # Run linter
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
```

### Database Commands
```bash
cd backend
npm run db:migrate      # Run migrations
npm run db:migrate:undo # Undo last migration
npm run db:seed         # Seed database
npm run db:seed:undo    # Undo all seeds
```

## Project Structure

```
webcat/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── migrations/         # Database migrations
│   ├── seeders/           # Database seeders
│   └── uploads/           # File uploads directory
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/           # Static assets
├── install.sh            # Installation script
├── start.sh             # Startup script
└── stop.sh              # Stop script
```

## Security Considerations

- All user inputs are validated and sanitized
- Passwords are hashed using bcrypt
- JWT tokens expire after 15 minutes (refresh tokens: 7 days)
- File uploads are restricted to images only (max 5MB)
- SQL injection prevention through parameterized queries
- XSS protection through proper escaping
- Rate limiting on authentication endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.