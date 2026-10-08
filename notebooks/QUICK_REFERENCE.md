# CastraVision Quick Reference

## Key Directories
- `CastraView/` - React frontend (Vite)
- `CastraServices/` - Django backend app
- `CastraVision/` - Django project config
- `data/` - Sample data files
- `docs/` - Documentation

## Important Files
- `CastraView/src/App.jsx` - Main frontend component
- `CastraServices/models.py` - Database models (KnowledgeChunk, BusinessAccount, CampaignImport)
- `CastraServices/views.py` - API endpoints (health, strategy_generate)
- `CastraServices/account_api.py` - Auth and profile endpoints
- `CastraServices/strategy.py` - Strategy generation logic
- `CastraServices/rag.py` - Retrieval-Augmented Generation
- `CastraVision/settings.py` - Django configuration
- `docker-compose.yml` - Multi-service deployment

## API Endpoints
- `POST /api/strategies/generate/` - Generate marketing strategy
- `GET/PUT /api/business-profile/` - Manage business profile
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/session/` - Check session
- `GET /api/campaign-imports/` - Import history
- `POST /api/campaign-imports/upload/` - Upload campaign data
- `GET /api/health/` - Health check

## Key Models
- `KnowledgeChunk` - Stores embedded text chunks for RAG
- `BusinessAccount` - User business profile information
- `CampaignImport` - History of uploaded campaign data

## Environment Variables
- `OPENAI_API_KEY` - Enable OpenAI LLM and embeddings
- `DATABASE_URL` - PostgreSQL connection string
- `EMBEDDING_PROVIDER` - auto/openai/local
- `ALLOW_LLM_FALLBACK` - Use fallback strategy when LLM fails
- `RAG_TOP_K` - Number of context chunks to retrieve

## Data Flow
1. User inputs business info → Stored in BusinessAccount
2. User uploads campaign data → Stored in CampaignImport (normalized)
3. User requests strategy → Backend:
   - Validates input with Pydantic
   - Retrieves relevant knowledge via RAG (pgvector cosine similarity)
   - Builds LLM prompt with business profile + history + context
   - Gets structured strategy from OpenAI (or fallback)
   - Returns JSON with strategy, context sources, provider

## Note
Content Studio shows template-based content suggestions, not AI-generated content (planned for future sprints).