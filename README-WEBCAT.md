# WebCat - Consignment Mall Catalog System

WebCat is a web-based catalog system designed for consignment mall members to share and manage larger items stored in a back room. The system includes authentication, item catalog management, messaging, calendar functionality, and a discussion forum.

## Features

- **User Authentication**: Role-based access control (Admin, Staff, Vendor)
- **Item Catalog**: Browse, search, and filter items with image galleries
- **Messaging System**: Direct communication between users about items
- **Calendar/Events**: Track sales events and vendor meetings
- **Discussion Forum**: Community discussions with threaded replies
- **Mobile Responsive**: Works on all devices
- **Tag System**: Organize items with flexible tagging

## Quick Start

1. Extract the WebCat package
2. Run the installation script:
   ```bash
   ./install-webcat.sh
   ```
3. Start the application:
   ```bash
   ./start.sh
   ```
4. Access WebCat at http://localhost:5173

## System Requirements

- **Node.js**: Version 18 or higher
- **MySQL**: Version 5.7 or higher
- **Operating System**: Linux or macOS
- **RAM**: 4GB minimum
- **Disk Space**: 500MB minimum

## Default Login Credentials

After installation with sample data:

- **Admin**: admin@webcat.com / admin123
- **Staff**: staff@webcat.com / staff123
- **Vendor**: john@vendor.com / vendor123

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem

## Project Structure

```
WebCat/
├── backend/          # Backend API server
│   ├── src/         # Source code
│   ├── uploads/     # File uploads
│   └── package.json
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── package.json
├── install-webcat.sh # Installation script
├── start.sh         # Start both servers
└── README.md        # This file
```

## Manual Installation

If you prefer to install manually:

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
npm run db:migrate
npm run db:seed       # Optional: Load sample data
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Edit with your settings
npm run dev
```

## Configuration

### Backend Configuration (backend/.env)

- `PORT`: Backend server port (default: 3001)
- `DB_*`: MySQL database connection settings
- `JWT_*`: JWT token configuration
- `UPLOAD_DIR`: File upload directory
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend Configuration (frontend/.env)

- `VITE_API_URL`: Backend API URL
- `VITE_APP_NAME`: Application name

## API Documentation

The backend provides RESTful API endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/items/*` - Item catalog management
- `/api/messages/*` - Messaging system
- `/api/forum/*` - Forum discussions
- `/api/events/*` - Calendar events
- `/api/tags/*` - Tag management
- `/api/users/*` - User management

## Troubleshooting

### MySQL Connection Issues

If you get MySQL authentication errors:
1. Check your MySQL root password
2. Ensure MySQL service is running
3. Run `mysql_secure_installation` if needed

### Port Conflicts

If ports 3001 or 5173 are in use:
1. Stop conflicting services
2. Or change ports in .env files

### Node Version Issues

If you get compatibility errors:
1. Update Node.js to version 18+
2. Use nvm to manage Node versions

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in backend/logs/
3. Submit issues to the project repository

## License

This project is provided as-is for testing and evaluation purposes.