# CastraVision Claude Configuration

This directory contains project-specific configurations for Claude Code to enhance the development experience for the CastraVision project.

## Directory Structure

- `.claude/rules/` - Contains rule files that provide guidelines for various aspects of development
- `.claude/skills/` - Contains skill files that provide step-by-step guidance for specific tasks
- `.claude/settings.json` - Editor and tool configuration settings
- `.claude/README.md` - This file

## Available Rules

### Code Review Rules (`rules/code-review-rules.md`)
Comprehensive guidelines for reviewing code in the CastraVision project, covering:
- Django backend development principles
- React/Vite frontend development principles
- Testing standards
- Documentation requirements
- Security practices
- Performance considerations
- Git workflow guidelines

### Code Review Rules (Vietnamese) (`rules/code-review-rules.vi.md`)
Phiên bản tiếng Việt của quy tắc review code với cùng nội dung chi tiết.

### Project Guidelines (`rules/project-guidelines.md`)
Overall project guidelines including:
- Project overview and technology stack
- Development workflow
- Coding standards
- Project structure guidelines
- Environment configuration
- Database guidelines
- API design principles
- Frontend guidelines
- Security practices
- Performance optimization
- Testing strategy
- Deployment process
- Contributing guidelines

### Project Guidelines (Vietnamese) (`rules/project-guidelines.vi.md`)
Phiên bản tiếng Việt của hướng dẫn dự án với cùng nội dung chi tiết.

## Available Skills

### Django Model Skill (`skills/django-model-skill.md`)
Step-by-step guidance for creating Django models following best practices, including:
- Planning the model
- Defining fields and relationships
- Adding model methods
- Model meta options
- Initial migration
- Admin registration
- Testing
- Documentation
- Field type guidelines
- Common patterns
- Validation guidelines
- Performance and security considerations

### Django Model Skill (Vietnamese) (`skills/django-model-skill.vi.md`)
Phiên bản tiếng Việt của hướng dẫn tạo mô hình Django.

### React Component Skill (`skills/react-component-skill.md`)
Guidance for creating React components following best practices, including:
- Planning the component
- Creating the component file
- Component structure
- Props definition
- State management
- Event handling
- Rendering logic
- Side effects
- Styling
- Performance optimization
- Accessibility
- Testing
- Documentation
- Component patterns
- Styling approaches
- Performance considerations
- Accessibility checklist
- Testing guidelines
- Naming conventions

### React Component Skill (Vietnamese) (`skills/react-component-skill.vi.md`)
Phiên bản tiếng Việt của hướng dẫn tạo thành phần React.

### API Development Skill (`skills/api-development-skill.md`)
Guidance for developing RESTful APIs using Django REST Framework, including:
- API design planning
- Setting up DRF
- Creating serializers
- Creating views/viewsets
- URL configuration
- Authentication and authorization
- Validation and error handling
- Pagination, filtering, and sorting
- API documentation
- Testing
- Performance considerations
- Security considerations
- Versioning strategy
- Serializer guidelines
- ViewSet patterns
- Pagination examples
- Filtering examples
- Testing API endpoints
- Performance optimization tips
- Security checklist

### API Development Skill (Vietnamese) (`skills/api-development-skill.vi.md`)
Phiên bản tiếng Việt của hướng dẫn phát triển API.

## Editor Settings

The `.claude/settings.json` file contains editor configurations for:
- Tab sizes and indentation preferences
- Python-specific settings (Black formatting, flake8 linting, pytest testing)
- JavaScript/React formatting
- CSS/HTML formatting
- Package.json formatting

## Usage

These configurations are automatically detected by Claude Code when working in the CastraVision project directory. They provide:

1. **Rules**: Guidelines that help maintain code quality and consistency across the project
2. **Skills**: Step-by-step guidance for common development tasks
3. **Settings**: Editor configurations to maintain consistent code formatting

To use a skill, you can reference it in your conversation with Claude Code, or Claude Code may automatically suggest relevant skills based on the context of your request.

For example, when creating a new Django model, you might ask:
"Help me create a new Django model for storing user preferences"

And Claude Code would apply the guidance from the Django Model Skill (available in both English and Vietnamese).

Similarly, when creating a React component, Claude Code would follow the React Component Skill guidelines (available in both English and Vietnamese).

These configurations help ensure consistency in code quality, reduce cognitive overhead for developers, and maintain project standards across the team.