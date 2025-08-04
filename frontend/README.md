# WebCat Frontend

React-based frontend for the WebCat consignment mall catalog system.

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── common/     # Shared components
│   │   ├── auth/       # Authentication components
│   │   ├── items/      # Item catalog components
│   │   ├── messages/   # Messaging components
│   │   ├── forum/      # Forum components
│   │   └── calendar/   # Calendar components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles
├── public/             # Static assets
└── dist/               # Production build
```

## Features

- React 18 with TypeScript
- React Router for navigation
- React Query for data fetching
- Bootstrap for UI components
- Axios for API calls
- React Hook Form for forms
- Mobile-responsive design

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api)
- `VITE_APP_NAME` - Application name
- `VITE_MAX_FILE_SIZE` - Maximum file upload size
- `VITE_MAX_IMAGES_PER_ITEM` - Maximum images per item