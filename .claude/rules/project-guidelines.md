# CastraVision Project Guidelines

## Project Overview
CastraVision is a full-stack application consisting of:
- **Backend**: Django REST Framework API (CastraServices/)
- **Frontend**: React/Vite application (CastraView/)
- **Utilities**: Shared tools and scripts (Utils/)
- **Tests**: Test suites (TEST/)
- **Documentation**: Project documentation (docs/)
- **Data**: Sample data and knowledge bases (data/)

## Development Workflow

### 1. Setting Up Development Environment
- [ ] Clone the repository
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate environment: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Install frontend dependencies: `cd CastraView && npm install`
- [ ] Set up environment variables (copy `.env.example` to `.env`)
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Load sample data (if applicable): `python manage.py loaddata sample_data.json`
- [ ] Start development servers:
  - Backend: `python manage.py runserver`
  - Frontend: `cd CastraView && npm run dev`

### 2. Making Changes
- [ ] Create a new branch: `git checkout -b feature/your-feature-name`
- [ ] Make your changes following the appropriate rules and skills
- [ ] Write or update tests as needed
- [ ] Run tests locally: `python manage.py test` and/or `cd CastraView && npm test`
- [ ] Ensure code lints properly
- [ ] Commit changes with clear, descriptive commit messages
- [ ] Push to remote: `git push -u origin feature/your-feature-name`
- [ ] Create a pull request for review

### 3. Code Review Process
- [ ] Ensure PR description clearly explains what and why
- [ ] Link to relevant issues or tickets
- [ ] Include screenshots for UI changes
- [ ] Address all review comments promptly
- [ ] Request re-review after addressing comments
- [ ] Ensure CI passes before merging
- [ ] Squash commits if requested by maintainers
- [ ] Delete branch after merge

### 4. Testing Guidelines
- [ ] Write unit tests for all new functionality
- [ ] Aim for >80% test coverage
- [ ] Test both positive and negative cases
- [ ] Mock external dependencies
- [ ] Run tests before committing
- [ ] Use pytest for Python tests and Jest/React Testing Library for frontend tests
- [ ] Include edge cases in test scenarios

### 5. Documentation Requirements
- [ ] Update README.md if architectural changes are made
- [ ] Update API documentation if endpoints change
- [ ] Add comments to explain complex logic
- [ ] Update docs/ directory with new features
- [ ] Ensure inline documentation follows project standards

## Technology Stack

### Backend (Django)
- Python 3.8+
- Django 4.x
- Django REST Framework 3.x
- PostgreSQL (recommended) or SQLite for development
- Celery for background tasks
- Redis for caching and message broker
- Django-filter for API filtering
- drf-spectacular or drf-yasg for API documentation

### Frontend (React)
- React 18+
- Vite 4.x
- React Router DOM 6.x
- Axios or Fetch for HTTP requests
- Formik or React Hook Form for forms
- Yup or Zod for validation
- Styled Components or CSS Modules for styling
- React Query for data fetching
- Redux Toolkit or Zustand for state management (if needed)
- TypeScript (optional but recommended)

### DevOps
- Docker for containerization
- Gunicorn for production WSGI server
- Nginx for reverse proxy
- PostgreSQL for production database
- Redis for caching
- Celery with RabbitMQ/Redis for background tasks
- AWS/GCP/Azure for cloud deployment
- GitHub Actions for CI/CD
- Sentry for error tracking
- LogRocket or similar for frontend monitoring

## Coding Standards

### Python (Backend)
- Follow PEP 8 style guide
- Use Black for code formatting (line length 88)
- Use isort for import sorting
- Use flake8 for linting
- Use pytest for testing
- Use factory_boy for test fixtures
- Use django-extensions for shell_plus and other extensions
- Use python-decouple or similar for environment management
- Use django-environ for environment variables

### JavaScript/Frontend
- Use Prettier for code formatting
- Use ESLint for code linting
- Use React Testing Library and Jest for testing
- Use TypeScript for type safety (if adopted)
- Use ES6+ features (arrow functions, destructuring, etc.)
- Avoid console.log in production code
- Use meaningful variable and function names
- Keep functions small and focused
- Use async/await for asynchronous operations
- Handle promises properly with try/catch

### Git Practices
- Use conventional commits format:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation changes
  - style: Formatting, missing semi-colons, etc.
  - refactor: Code refactoring
  - perf: Performance improvements
  - test: Adding or correcting tests
  - chore: Maintenance tasks
- Keep commits atomic and focused
- Write clear commit messages explaining why
- Reference issue numbers in commits when applicable
- Rebase feature branches before merging
- Delete branches after merging

## Project Structure Guidelines

### Backend (CastraServices/)
```
CastraServices/
├── __init__.py
├── settings.py
├── urls.py
├── wsgi.py
├── asgi.py
├── celery.py
├── admin.py
├── apps.py
├── models.py          # Database models
├── views.py           # API views
├── serializers.py     # API serializers
├── filters.py         # API filters
├── permissions.py     # Custom permissions
├── migrations/        # Database migrations
├── management/        # Custom management commands
├── tests.py           # Tests
└── utils/             # Utility functions
```

### Frontend (CastraView/src/)
```
src/
├── assets/            # Images, icons, fonts
├── components/        # Reusable components
│   ├── ui/            # Primitive UI components (Button, Input, etc.)
│   ├── layout/        # Layout components (Header, Footer, Sidebar)
│   └── features/      # Feature-specific components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── services/          # API service functions
├── store/             # State management (if using Redux/Zustand)
├── styles/            # CSS files, themes, variables
├── routes/            # Routing configuration
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

### Utilities (Utils/)
```
Utils/
├── __init__.py
├── setup_prj.py       # Project setup scripts
├── data_processing.py # Data processing utilities
├── ml_models/         # Machine learning models
└── validation/        # Validation utilities
```

## Environment Configuration
- Use `.env` files for environment variables
- Never commit `.env` files to repository
- Use `.env.example` to show required variables
- Use python-decouple or similar for accessing env vars in Django
- Use import.meta.env for accessing env vars in Vite/react
- Separate environments: development, staging, production

## Database Guidelines
- Use migrations for all schema changes
- Never modify migration files after they've been applied
- Test migrations on a copy of production data
- Use appropriate field types and constraints
- Add indexes for frequently queried fields
- Consider partitioning for large tables
- Use transactions for related operations
- Backup regularly in production

## API Design Principles
- Follow RESTful conventions
- Use appropriate HTTP status codes
- Version APIs when breaking changes are needed
- Implement proper authentication and authorization
- Validate all inputs
- Provide meaningful error messages
- Implement pagination for list endpoints
- Support filtering, sorting, and searching
- Document all endpoints thoroughly
- Monitor API usage and performance

## Frontend Guidelines
- Create reusable components
- Use component composition over inheritance
- Keep component state localized when possible
- Use React Context or state management for global state
- Optimize re-renders with useMemo and useCallback
- Implement proper error boundaries
- Lazy load non-critical components
- Optimize images and assets
- Ensure responsive design
- Follow accessibility guidelines (WCAG 2.1)
- Test across different browsers and devices

## Security Practices
- Never hardcode secrets or credentials
- Use environment variables for sensitive data
- Implement proper input validation and sanitization
- Use Django's built-in security features
- Implement CSRF protection
- Use secure HTTP headers
- Validate file uploads
- Implement rate limiting
- Keep dependencies updated
- Regular security audits
- Use HTTPS in production
- Implement proper logging and monitoring

## Performance Optimization
- Backend:
  - Use database indexing
  - Optimize queries with select_related/prefetch_related
  - Implement caching strategies
  - Use pagination for large datasets
  - Consider database read replicas
  - Use CDN for static assets
  - Enable Gzip compression
  - Monitor and optimize slow queries

- Frontend:
  - Code splitting with React.lazy and Suspense
  - Lazy load images and components
  - Optimize bundle size
  - Use HTTP/2 when possible
  - Implement caching strategies
  - Minimize DOM manipulations
  - Use requestIdleCallback for low-priority work
  - Optimize CSS and JavaScript delivery
  - Use web workers for heavy computations

## Testing Strategy
- Unit Tests: Test individual functions and components
- Integration Tests: Test how modules work together
- End-to-End Tests: Test user flows (using Cypress or Playwright)
- Performance Tests: Test under load
- Security Tests: Test for vulnerabilities
- Continuous Integration: Run tests on every PR
- Test Coverage: Aim for meaningful coverage, not just percentage

## Deployment Process
- [ ] Ensure all tests pass
- [ ] Update version numbers if applicable
- [ ] Build frontend assets: `cd CastraView && npm run build`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Run migrations on production: `python manage.py migrate`
- [ ] Restart application services
- [ ] Monitor for errors post-deployment
- [ ] Rollback plan ready if needed
- [ ] Update documentation if deployment process changes

## Contributing Guidelines
- Fork the repository
- Create a feature branch
- Make changes following these guidelines
- Ensure tests pass
- Submit pull request
- Participate in code review
- Follow project coding standards
- Be respectful and constructive in discussions

## License and Legal
- Ensure all dependencies are properly licensed
- Respect intellectual property rights
- Include appropriate license headers
- Follow data protection regulations (GDPR, etc.)
- Implement proper terms of service and privacy policy