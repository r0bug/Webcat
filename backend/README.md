# WebCat Backend

## Setup

1. Copy `.env.example` to `.env` and update the values
2. Install dependencies: `npm install`
3. Create MySQL database named `webcat_db`
4. Run database migrations: `npm run db:migrate` (after creating models)
5. Start development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Check TypeScript types
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── tests/              # Test files
├── uploads/            # Uploaded images
└── dist/               # Compiled JavaScript
```