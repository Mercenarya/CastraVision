# Code Review Rules for CastraVision Project

## General Principles
1. **Clarity over cleverness** - Write code that is easy to understand
2. **Consistency** - Follow existing code patterns and styles
3. **Completeness** - Ensure all edge cases are handled
4. **Testability** - Write code that is easy to test

## Django Backend Rules
1. **Models**
   - Use descriptive field names
   - Add proper docstrings to models and methods
   - Use Choices for fields with limited options
   - Add __str__ methods to all models
   - Use related_name for foreign keys to avoid reverse accessor conflicts

2. **Views**
   - Use class-based views when appropriate
   - Handle exceptions properly
   - Return appropriate HTTP status codes
   - Validate input data thoroughly

3. **Serializers (if using DRF)**
   - Explicitly list fields rather than using '__all__'
   - Add validation methods for complex validations
   - Use SerializerMethodField for computed fields

4. **Forms**
   - Add proper labels and help text
   - Implement clean() methods for cross-field validation
   - Use ModelForm when appropriate

## Frontend Rules (React/Vite)
1. **Components**
   - Use functional components with hooks
   - Keep components small and focused
   - Use PropTypes or TypeScript for prop validation
   - Memoize expensive computations with useMemo/useCallback

2. **Styling**
   - Use CSS modules or styled-components for scoped styling
   - Follow BEM naming convention for CSS classes
   - Use CSS variables for theme colors

3. **State Management**
   - Use React Query for server state
   - Use Context API or Zustand for global client state
   - Avoid prop drilling by using context when appropriate

## Testing Rules
1. **Unit Tests**
   - Write tests for each function/method
   - Test both positive and negative cases
   - Mock external dependencies
   - Aim for >80% coverage

2. **Integration Tests**
   - Test API endpoints
   - Test database interactions
   - Test authentication flows

## Documentation Rules
1. **Code Comments**
   - Explain why, not what
   - Update comments when code changes
   - Remove commented-out code

2. **API Documentation**
   - Keep API docs up to date
   - Use OpenAPI/Swagger for REST APIs
   - Document all parameters and return values

## Security Rules
1. **Input Validation**
   - Validate all inputs on both client and server
   - Use Django's built-in validation where possible
   - Sanitize user-generated content

2. **Authentication & Authorization**
   - Use Django's authentication system
   - Implement proper permission checks
   - Use HTTPS in production

3. **Data Protection**
   - Never hardcode secrets
   - Use environment variables for configuration
   - Encrypt sensitive data at rest

## Performance Rules
1. **Database**
   - Use select_related/prefetch_related to avoid N+1 queries
   - Add database indexes for frequently queried fields
   - Use pagination for large querysets

2. **Frontend**
   - Lazy load non-critical components
   - Optimize images and assets
   - Minimize bundle size

## Git Rules
1. **Commit Messages**
   - Use conventional commits format
   - Reference issue numbers when applicable
   - Keep messages concise but descriptive

2. **Branching**
   - Use descriptive branch names (feature/, bugfix/, hotfix/)
   - Delete branches after merging
   - Rebase feature branches before merging

## Code Style
1. **Python**
   - Follow PEP 8
   - Use black for code formatting
   - Use isort for import sorting
   - Maximum line length: 88 characters (black default)

2. **JavaScript/TypeScript**
   - Use Prettier for code formatting
   - Use ESLint for code quality
   - Maximum line length: 80-100 characters
   - Use const/let, avoid var

## Review Process
1. **Before Submitting**
   - Run all tests locally
   - Ensure code lints without errors
   - Update documentation if needed
   - Squash commits if necessary

2. **During Review**
   - Address all review comments
   - Explain design decisions when asked
   - Be open to constructive feedback

3. **After Approval**
   - Ensure CI passes before merging
   - Delete feature branch after merge