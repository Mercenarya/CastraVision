# React Component Creation Skill

This skill provides guidance for creating React components following best practices for the CastraView frontend.

## When to Use
Use this skill when you need to create a new React component or modify an existing one in the CastraView/src directory.

## Steps to Follow

### 1. Planning the Component
- [ ] Determine what the component should do and display
- [ ] Identify required props and their types
- [ ] Plan the component's state needs
- [ ] Consider what events the component should emit
- [ ] Think about reusability and composition
- [ ] Sketch the component structure if complex

### 2. Creating the Component File
- [ ] Create the component in `CastraView/src/components/` or appropriate subdirectory
- [ ] Use PascalCase for component file names (e.g., `MyComponent.jsx`)
- [ ] Choose between `.jsx` and `.js` based on project convention
- [ ] For TypeScript projects, use `.tsx` extension
- [ ] Add a brief comment at the top describing the component's purpose

### 3. Component Structure
- [ ] Use functional components with hooks (avoid class components unless maintaining legacy code)
- [ ] No `import React` needed (React 19 automatic JSX runtime)
- [ ] Import any hooks you'll use: `import { useState, useEffect } from 'react';`
- [ ] Import any external libraries or components
- [ ] Import `cn` from `@/lib/utils` and components from `@/components/ui/` if needed
- [ ] Export the component as default or named export based on usage patterns

### 4. Props Definition
- [ ] Define prop types using PropTypes or TypeScript interfaces
- [ ] Mark required props as required
- [ ] Provide default values for optional props using defaultProps or default parameters
- [ ] Use descriptive names for props
- [ ] Consider using object destructuring in function parameters
- [ ] Document what each prop is used for

### 5. State Management
- [ ] Use `useState` for local component state
- [ ] Use `useReducer` for complex state logic
- [ ] Consider lifting state up when multiple components need to share state
- [ ] Use Context API or state management libraries (Redux, Zustand, etc.) for global state
- [ ] Avoid duplicating state that can be derived from props or other state
- [ ] Initialize state with appropriate default values

### 6. Event Handling
- [ ] Create handler functions for user interactions
- [ ] Use descriptive names for handler functions (e.g., `handleClick`, `handleSubmit`)
- [ ] Bind event handlers properly (arrow functions in JSX or bind in constructor)
- [ ] Prevent default behavior when needed using `event.preventDefault()`
- [ ] Stop propagation when needed using `event.stopPropagation()`
- [ ] Pass data up to parent components via callback props

### 7. Rendering Logic
- [ ] Use conditional rendering appropriately (ternary operators, logical AND)
- [ ] Use `.map()` for rendering lists with unique keys
- [ ] Keep JSX readable by extracting complex logic to variables or functions
- [ ] Avoid complex expressions in JSX; move them to variables above the return statement
- [ ] Use fragments (`<>...</>`) when returning multiple elements without a wrapper
- [ ] Consider using SWR or React Query for data fetching

### 8. Side Effects
- [ ] Use `useEffect` for side effects (data fetching, subscriptions, DOM manipulation)
- [ ] Properly cleanup effects when needed (return cleanup function)
- [ ] Specify dependency array correctly to avoid stale closures or infinite loops
- [ ] Use `useLayoutEffect` for synchronous DOM measurements when needed
- [ ] Consider using custom hooks for reusable side effect logic

### 9. Styling
- [ ] Use Tailwind classes in JSX; prefer the shadcn components in `components/ui/`
- [ ] Add base components with `npx shadcn@latest add <name>`; do not copy code by hand
- [ ] Use `cva` for variants and `cn()` to merge classes
- [ ] Take colors/spacing from theme tokens (`tokens.css`); no hard-coded hex
- [ ] No per-component `.css` files, CSS modules or styled-components in new code
- [ ] Avoid inline styles for non-trivial UI
- [ ] Ensure responsiveness (`sm:`, `md:`, `lg:`)

### 10. Performance Optimization
- [ ] Use `React.memo` for components that render frequently with same props
- [ ] Use `useMemo` for expensive computations
- [ ] Use `useCallback` for functions passed as props to memoized components
- [ ] Consider code-splitting with `React.lazy` and `Suspense` for large components
- [ ] Optimize images and assets
- [ ] Avoid unnecessary re-renders by checking why components are re-rendering

### 11. Accessibility (a11y)
- [ ] Use semantic HTML elements when possible
- [ ] Add appropriate `aria-label`, `aria-labelledby`, etc. attributes
- [ ] Ensure keyboard navigability
- [ ] Manage focus appropriately for modal dialogs
- [ ] Ensure sufficient color contrast
- [ ] Add skip links for screen readers when appropriate
- [ ] Test with screen readers if possible

### 12. Testing
- [ ] Create unit tests using Jest and React Testing Library
- [ ] Test component renders correctly with different props
- [ ] Test user interactions and state changes
- [ ] Test edge cases and error conditions
- [ ] Mock API calls and external dependencies
- [ ] Aim for meaningful test coverage, not just line coverage

### 13. Documentation
- [ ] Add JSDoc comments for complex components
- [ ] Document prop types and their expected values
- [ ] Include usage examples if the component is complex or reusable
- [ ] Note any important considerations or limitations

## Component Patterns

### Presentational Component
```jsx
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
// Primary page action; wraps the shadcn Button to keep one API across the project.

// Nút hành động chính của trang; bọc shadcn Button để thống nhất API trong dự án.
const ActionButton = ({ variant = 'default', size = 'default', className, children, onClick }) => (
  <UiButton variant={variant} size={size} className={cn('gap-2', className)} onClick={onClick}>
    {children}
  </UiButton>
)

ActionButton.propTypes = {
  variant: PropTypes.oneOf(['default', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
}

export default ActionButton
```

### Container Component (Data Fetching)
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>No user selected</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* ... */}
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserProfile;
```

### Higher-Order Component (HOC)
```jsx
import React from 'react';

const withLoading = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { isLoading: false };
    }

    componentDidUpdate(prevProps) {
      // Implement loading logic based on prop changes
    }

    render() {
      const { isLoading } = this.state;
      if (isLoading) {
        return <div>Loading...</div>;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};

export default withLoading;
```

### Custom Hook
```jsx
import { useState, useEffect } from 'react';

const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validate = () => {
    // Implement validation logic
    // Set errors state
    return Object.keys(errors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    validate,
    reset
  };
};

export default useForm;
```

## Styling Approaches

CastraView uses **Tailwind CSS v4 + shadcn/ui** (JavaScript, no TypeScript).

- Add base components with `npx shadcn@latest add button` (generated into `src/components/ui/`).
- Hand-written components live in `src/components/` and compose the ones in `ui/`.
- Use `cva` for variants and `cn()` (`src/lib/utils.js`) to merge classes.
- Color tokens live in `src/styles/tokens.css` (shadcn theme variables + `success`/`warning`/`info`/`violet`/`coral`); never hard-code colors.
- Do not create a per-component `.css` file for new components.

### Variant example with cva
```jsx
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      success: 'bg-success/15 text-success',
      danger: 'bg-destructive/15 text-destructive',
    },
  },
  defaultVariants: { tone: 'success' },
})

export default function StatusBadge({ tone, className, children }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>
}
```

## Performance Considerations

### Bundle Optimization
- Import only what you need from libraries
- Use dynamic imports for non-critical components
- Consider using `React.lazy` for code splitting
- Analyze bundle with tools like Webpack Bundle Analyzer

### Render Optimization
- Use `React.memo` to prevent unnecessary re-renders
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive computations
- Avoid creating new objects/arrays in render unless necessary
- Use keys that are stable and predictable for lists

### Data Fetching
- Use React Query or SWR for data fetching and caching
- Implement proper caching strategies
- Use pagination and infinite scrolling for large lists
- Cancel unnecessary requests when components unmount

## Accessibility Checklist

### Semantic HTML
- Use `<button>` for buttons, not `<div>` or `<span>`
- Use `<input>`, `<select>`, `<textarea>` for form elements
- Use `<label>` elements associated with form controls
- Use semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Use `tabindex` appropriately (avoid positive values)
- Manage focus in modals and dropdowns
- Provide visible focus indicators

### ARIA Attributes
- Use `aria-label` when element text is not descriptive
- Use `aria-labelledby` or `aria-describedby` for complex relationships
- Use `aria-live` for dynamic content updates
- Use `aria-expanded` for collapsible elements
- Use `aria-controls` to indicate which element is controlled

### Screen Reader Support
- Test with screen readers (NVDA, VoiceOver, TalkBack)
- Ensure all images have appropriate alt text
- Use `<svg>` with `<title>` and `<desc>` for accessible icons
- Provide transcripts for audio content
- Ensure sufficient color contrast (WCAG 2.1 AA)

## Testing Guidelines

### Unit Tests with React Testing Library
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByRole('button', { name: /click me/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Custom Hooks
```jsx
import { renderHook, act } from '@testing-library/react-hooks';
import useForm from './useForm';

test('useForm updates values on change', () => {
  const { result } = renderHook(() => useForm({ name: '' }));
  
  act(() => {
    result.current.handleChange({ target: { name: 'name', value: 'John' } });
  });
  
  expect(result.current.values.name).toBe('John');
});
```

## Naming Conventions

### Files and Folders
- Use PascalCase for component files: `MyComponent.jsx`
- Use kebab-case for utility files: `utils/helpers.js`
- Group related components in folders
- Use index.js for barrel exports when appropriate

### Component Names
- Use descriptive names that indicate what the component does
- Use prefixes for component types: `Button`, `Modal`, `Form`, `Card`
- Avoid generic names like `Item`, `Data`, `Component`

### Props and State
- Use camelCase for prop and state names
- Use descriptive names: `isLoading`, `userData`, `onSubmit`
- Use `on` prefix for event handlers: `onClick`, `onChange`
- Use `is` or `has` prefix for boolean values: `isVisible`, `hasError`

### CSS Classes (Tailwind)
- Use Tailwind utility classes directly in JSX; do not introduce new BEM class names
- Merge conditional classes with `cn()` from `@/lib/utils`
- Take colors/spacing from theme tokens (`bg-primary`, `text-muted-foreground`), never ad-hoc hex values
- If the same class group repeats, extract a component or a `cva` variant
