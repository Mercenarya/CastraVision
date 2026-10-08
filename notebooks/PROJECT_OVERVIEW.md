# CastraVision Project Overview

## Git Commit History

Recent commits (most recent first):
- `b68166f` - set up data pre-processing pipeline (30 hours ago)
- `1064726` - update ci progress input (2 days ago)
- `d72b90c` - set up basics ads CRUD, csv Loader for data pipeline (2 days ago)
- `5c29f2c` - Implement Sprint 1 CastraVision workspace (4 days ago)
- `62ff6cb` - update config ,/ Test for facebook business SDK (7 days ago)
- `63595f7` - update requirements.txt (9 days ago)
- `40d19c3` - update utils (10 days ago)
- `cf85d95` - update readme (10 days ago)
- `fbba914` - first commit (10 days ago)
- `5ba05c2` - First Commit (10 days ago)

## Directory Structure and Purpose

### Root Level
- **CastraView/** - Frontend React application (Vite + React 19)
- **CastraServices/** - Django app containing business logic, models, views, and API endpoints
- **CastraVision/** - Django project settings and configuration
- **data/** - Sample data files for knowledge base and strategy requests
- **docs/** - Documentation files (SPRINT1_SETUP.md, SPRINT1_UI.md, PROPOSAL_ALIGNMENT.md)
- **Tests/** - Test files (including facebookAgent tests)
- **Utils/** - Utility scripts (setup_prj.py)
- **docker-compose.yml** - Docker Compose configuration for full stack deployment
- **Dockerfile.backend** - Backend Docker image configuration
- **manage.py** - Django management script
- **requirements.txt** - Python dependencies
- **pyproject.toml** - Project configuration
- **pytest.ini** - pytest configuration
- **.env.example** - Example environment variables
- **.gitignore** - Git ignore rules
- **Readme.md** - Alternative README (appears to be a duplicate)

### CastraView/ (Frontend)
- **src/main.jsx** - Entry point for React application
- **src/App.jsx** - Main application component with routing and state management
- **src/App.css** - Global styles
- **src/index.css** - Additional styles
- **public/** - Static assets (favicon.svg, icons.svg)
- **src/assets/** - Image assets (hero.png, react.svg, vite.svg)
- **vite.config.js** - Vite configuration
- **package.json** - Frontend dependencies and scripts
- **package-lock.json** - Locked dependency versions
- **.oxlintrc.json** - Oxlint configuration
- **Dockerfile** - Frontend Docker image configuration

### CastraServices/ (Backend Django App)
- **models.py** - Database models:
  - `KnowledgeChunk` - Stores embedded knowledge chunks with pgvector support
  - `BusinessAccount` - User business profile information
  - `CampaignImport` - History of campaign data imports
- **views.py** - API endpoint implementations:
  - `health()` - Health check endpoint
  - `strategy_generate()` - Main strategy generation endpoint
- **account_api.py** - Authentication and profile management endpoints:
  - Registration, login, logout, session handling
  - Business profile CRUD operations
  - Campaign import/export functionality
- **urls.py** - URL routing for the API
- **schemas.py** - Pydantic models for request/response validation
- **strategy.py** - Strategy generation logic with OpenAI integration and fallback
- **prompts.py** - System prompts and strategy prompt builders
- **rag.py** - Retrieval-Augmented Generation implementation with embedding providers
- **tasks.py** - Celery background tasks (embedding generation)
- **tests.py** - Unit tests

### CastraVision/ (Django Project)
- **settings.py** - Main Django configuration
- **urls.py** - Project-level URL routing (includes admin and API)
- **wsgi.py** - WSGI application entry point
- **asgi.py** - ASGI application entry point
- **celery.py** - Celery configuration
- **__init__.py** - Package initializer

## Key Files and Their Purpose

### Core Functionality

1. **Strategy Generation Flow**:
   - Frontend: `CastraView/src/App.jsx` → StrategyScreen component collects user input
   - Backend: `CastraServices/views.strategy_generate()` validates input via Pydantic schemas
   - Processing: `CastraServices.strategy.generate_strategy()` orchestrates:
     - Knowledge retrieval via `rag.search_knowledge()`
     - Prompt building via `prompts.build_strategy_prompt()`
     - LLM invocation via `OpenAIStrategyProvider` (with fallback to deterministic strategy)
   - Response: Structured strategy recommendation with budget allocation, messaging, and actions

2. **Authentication System**:
   - Frontend: AuthScreen component handles login/register forms
   - Backend: `account_api.py` provides endpoints:
     - `/auth/register/` - User registration
     - `/auth/login/` - User authentication
     - `/auth/session/` - Session checking
     - `/auth/csrf/` - CSRF token provision
     - `/auth/logout/` - User logout

3. **Business Profile Management**:
   - Frontend: ProfileScreen component for business information
   - Backend: `/api/business-profile/` endpoint (GET/PUT) in account_api.profile()

4. **Campaign Data Import**:
   - Frontend: ImportScreen component handles file upload and preview
   - Backend: `/api/campaign-imports/` endpoints:
     - GET: Import history
     - POST/upload/: File upload and normalization
     - Processing: CSV/XLSX parsing, column mapping, validation

5. **Knowledge Base (RAG System)**:
   - Storage: `KnowledgeChunk` model with pgvector field for embeddings
   - Ingestion: `ingest_document()` function in rag.py chunks text and creates embeddings
   - Retrieval: `search_knowledge()` function finds similar chunks via cosine similarity
   - Embedding Providers: 
     - OpenAIEmbeddingProvider (when API key available)
     - LocalHashEmbeddingProvider (deterministic fallback for development)

6. **Background Processing**:
   - Celery task `embed_pending_chunks()` automatically generates embeddings for new KnowledgeChunks
   - Triggered via Django management command or periodic schedule

### Configuration Files

- **docker-compose.yml**: Defines five services:
  - `postgres`: PostgreSQL 16 with pgvector extension
  - `redis`: Redis 7 for caching and Celery broker
  - `backend`: Django application (API server)
  - `celery_worker`: Celery worker for background tasks
  - `frontend`: Vite development server for React app

- **CastraVision/settings.py**: Key configurations:
  - Database: PostgreSQL via DATABASE_URL or local SQLite
  - CORS: Frontend origins allowed
  - OpenAI: API key, model, embedding model settings
  - Embedding: Provider selection (auto/openai/local)
  - RAG: Top-K retrieval count
  - Celery: Broker and result backend URLs

- **requirements.txt**: Python dependencies including:
  - Django, djangorestframework, psycopg2-binary
  - pgvector (for PostgreSQL vector similarity search)
  - openai, tenacity (for LLM API with retries)
  - pydantic (for data validation)
  - python-dotenv, dj-database-url (configuration helpers)

- **CastraView/package.json**: Frontend dependencies:
  - React 19, React DOM
  - Vite 8 (build tool)
  - @vitejs/plugin-react (React plugin for Vite)
  - oxlint (linting tool)
  - @types/react (TypeScript definitions)

## Data Flow Summary

1. **User Onboarding**:
   - User registers/login via AuthScreen → Django auth endpoints
   - User completes business profile via ProfileScreen → BusinessAccount model

2. **Data Import**:
   - User uploads CSV/XLSX via ImportScreen → CampaignImport model stores normalized rows
   - File parsed, columns mapped to standard format (channel, period, spend, clicks, impressions, conversions, revenue)

3. **Strategy Generation**:
   - User fills form in StrategyScreen → POST to /api/strategies/generate/
   - Backend validates request with BusinessProfile schema
   - Retrieves relevant knowledge chunks via RAG system
   - Builds prompt with business profile, historical data, and context
   - Calls OpenAI API (or uses fallback) to generate structured strategy
   - Returns JSON with strategy recommendation, context sources, and provider info

4. **Content Creation**:
   - User views generated strategy in ContentStudioScreen
   - Sees template-based content suggestions for selected channels
   - Can edit and copy content (note: this is template-based, not AI-generated in Sprint 1)

## Technical Stack

### Frontend
- React 19 with Vite 8 build tool
- Custom CSS (no UI framework like Tailwind/shadcn as initially proposed)
- Fetch API for backend communication
- Cookie-based authentication with CSRF protection

### Backend
- Django 6 with Django ORM
- PostgreSQL 16 with pgvector extension for vector similarity search
- Redis 7 for caching and Celery broker
- OpenAI API for strategy generation (with deterministic fallback)
- Pydantic for request/response validation
- Celery for background embedding generation

### DevOps
- Docker Compose for local development and testing
- GitHub Actions CI (referenced in documentation)
- Environment variable configuration via .env file

## Sprint 1 Scope (FR01)
According to documentation, Sprint 1 implements a "vertical slice" for FR01:
- RAG pipeline with PostgreSQL + pgvector
- Strategy API with LLM integration and fallback
- Strategy screen with form, results, and budget allocation
- Project configuration with Docker Compose
- Business size field implementation (Micro/Small/Medium/Large)
- Health check endpoint

## Limitations & Future Work (From Documentation)

### Not Implemented in Sprint 1:
- Direct synchronization with Meta/Google Ads/TikTok APIs
- Specialized AI agents for different marketing functions
- Reranker, hybrid search, or advanced retrieval techniques
- Strategy history storage per user
- Production web server, HTTPS, secrets management
- AI-powered content generation (Content Studio shows template-based content only)

### Key Technical Notes:
- Uses Django sessions for authentication (not JWT)
- Business profile data is isolated per user (no cross-user contamination in RAG)
- Historical campaign data is sent directly in strategy requests (not stored globally)
- Embedding provider must match between ingestion and retrieval
- Automatic migration runs CREATE EXTENSION IF NOT EXISTS vector on PostgreSQL startup

This overview summarizes the CastraVision project as it exists after Sprint 1 implementation, focusing on the architecture, key components, and data flows that enable the core marketing strategy generation functionality.