# WebCat Development Guide

## Getting Started

1. Run the installation script: `./install.sh`
2. Configure your database credentials in `backend/.env`
3. Start development servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev` (when available)

## Development Workflow

### Code Changes
1. Always describe your implementation plans before proceeding
2. Keep a log of code changes with rationale
3. Update documentation after every code change
4. Run linting and type checking before committing

### Git Workflow
1. Create feature branches for new functionality
2. Write descriptive commit messages
3. Test thoroughly before merging

### Database Changes
1. Create migrations for schema changes
2. Never modify the database directly in production
3. Test migrations on a development database first

## Code Style Guidelines

### TypeScript
- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` types
- Use async/await over callbacks

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Include pagination for list endpoints
- Validate all inputs

### Security
- Never commit secrets or API keys
- Use parameterized queries
- Validate and sanitize all user inputs
- Implement rate limiting

## Testing

### Backend Testing
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm test -- --coverage  # Coverage report
```

### Frontend Testing (pending)
```bash
cd frontend
npm test
```

## Common Tasks

### Adding a New API Endpoint
1. Create route in `src/routes/`
2. Create controller in `src/controllers/`
3. Add validation in controller
4. Update API documentation
5. Write tests

### Adding a Database Model
1. Create model in `src/models/`
2. Create migration
3. Update types in `src/types/`
4. Run migration: `npm run db:migrate`

### Adding Frontend Component (pending)
1. Create component in `src/components/`
2. Add types/interfaces
3. Write unit tests
4. Update Storybook (if applicable)

## Troubleshooting

### Database Connection Issues
- Check MySQL is running: `systemctl status mysql`
- Verify credentials in `.env`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use
- Backend default: 3000
- Frontend default: 5173
- Change in `.env` if needed

### TypeScript Errors
- Run `npm run lint` to check types
- Ensure all dependencies have type definitions
- Check `tsconfig.json` settings

## Performance Considerations

### Backend
- Use database indexes on frequently queried fields
- Implement caching for static data
- Use pagination for large datasets
- Optimize image uploads

### Frontend
- Lazy load images and components
- Implement virtual scrolling for long lists
- Use React.memo for expensive components
- Optimize bundle size

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Tests passing
- [ ] TypeScript builds without errors
- [ ] Security headers configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy in place