import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from backend.Apis.ai_assistant import router as ai_assistant_router
from backend.Apis.auth import router as auth_router
from backend.Apis.RecipeRequest import router as recipe_router
from backend.Apis.stripe_payment import router as stripe_router
from backend.Apis.subscription import router as subscription_router
from backend.Apis.user_profile import router as user_profile_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recipe App API",
    description="A comprehensive recipe management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS control: meaning we cant have outside applications hitting our fastapi, without us saying this application is allowed to make calls to our endpoints, protects from outside users
app.add_middleware(
    CORSMiddleware,
    # allow all types requsts if its from our frontend
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add trusted host middleware for security
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Mount static files for uploaded images
# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS middleware for static files
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    
    # Add CORS headers for static file requests
    if request.url.path.startswith("/uploads/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Error handling and performance middleware
@app.middleware("http")
async def handle_connection_errors(request, call_next):
    import asyncio
    import time
    
    # Retry configuration
    max_retries = 2
    retry_delay = 0.1  # 100ms
    
    for attempt in range(max_retries + 1):
        try:
            # Add timeout for database-heavy operations
            response = await asyncio.wait_for(
                call_next(request),
                timeout=30.0  # 30-second timeout for all requests
            )
            return response
            
        except asyncio.TimeoutError:
            logger.error(f"Request timeout: {request.url.path}")
            return JSONResponse(
                status_code=504,
                content={"detail": "Request timeout - server is overloaded"}
            )
            
        except ConnectionResetError as e:
            if attempt < max_retries:
                logger.warning(f"Connection reset on attempt {attempt + 1}, retrying: {request.url.path}")
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                continue
            else:
                logger.error(f"Connection reset after {max_retries} retries: {request.url.path}")
                return JSONResponse(
                    status_code=503,
                    content={"detail": "Service temporarily unavailable - connection error"}
                )
                
        except Exception as e:
            logger.error(f"Request failed: {e}")
            # Return a proper error response instead of crashing
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )

# include routers from the recipe request module
app.include_router(recipe_router)
app.include_router(auth_router)
app.include_router(ai_assistant_router, prefix="/ai", tags=["AI Assistant"])
app.include_router(user_profile_router, prefix="/users", tags=["User Profile"])
app.include_router(stripe_router, prefix="/payment", tags=["Payment"])
app.include_router(subscription_router, tags=["Subscription"])


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Recipe App API is running!"}


# ===============================================
# MASTER PROMPT: AI CHEF ASSISTANT IMPLEMENTATION
# ===============================================
# GOAL:
# Implement an AI chef assistant for a recipe app.
# The assistant will:
# 1. Answer user questions about a recipe while cooking.
# 2. Remember what's happened in the current cooking session.
# 3. Use GPT-4o-mini via OpenAI API for reasoning.
# 4. Retrieve recipe context via hybrid search (structured + semantic).
# 5. Support voice input/output for hands-free cooking.
#
# =================
# BACKEND (FastAPI)
# =================
# STACK: Python, FastAPI, PostgreSQL (with pgvector), SQLAlchemy ORM
#
# MAIN REQUIREMENTS:
# 1. **Precompute embeddings**:
#    - When a recipe is first added, compute its step and ingredient embeddings using OpenAI Embeddings API.
#    - Store embeddings in a `VECTOR` column in PostgreSQL with `pgvector`.
#    - Create indexes for fast nearest-neighbor search.
#
# 2. **Hybrid retrieval**:
#    - Structured filter: Pre-filter by `recipe_id` for the active cooking session.
#    - Semantic search: Use pgvector cosine similarity to find the most relevant steps/ingredients.
#    - Chunking: Break recipe steps into small, meaningful chunks to improve retrieval accuracy.
#
# 3. **Session memory**:
#    - Store conversation state in `user_sessions` table (session_id, current_step, chat_history).
#    - Use stored history to provide context for the AI without exceeding token limits.
#
# 4. **Context injection (RAG)**:
#    - Before sending a user question to GPT-4o-mini, retrieve relevant chunks from the active recipe.
#    - Append these chunks to the AI prompt so the model has up-to-date context.
#
# 5. **LangChain integration**:
#    - Use LangChain's RetrievalQA pipeline to handle:
#       a) Passing the right context.
#       b) Managing prompt templates.
#       c) Handling multiple sources of context (recipe + conversation history).
#
# 6. **Voice support**:
#    - Speech-to-Text (STT): OpenAI Whisper API for accuracy.
#    - Text-to-Speech (TTS): OpenAI gpt-4o-mini-tts or ElevenLabs for premium voices.
#
# ===================
# FRONTEND (React.js)
# ===================
# STACK: React + CSS, Zustand for state management.
#
# MAIN REQUIREMENTS:
# 1. Chat-style interface with both text and voice input/output.
# 2. Send user messages and audio to backend API.
# 3. Receive AI text + optional audio response.
# 4. Keep current recipe and conversation in state for smooth session flow.
#
# ====================
# DATABASE (PostgreSQL)
# ====================
# TABLES:
# - users (id, name, email, auth info)
# - recipes (id, title, metadata, embedding VECTOR)
# - ingredients(id, recipe_id, ingredient, embedding VECTOR)
# - instructions (id, recipe_id, step_number, text, embedding VECTOR)
# - user_sessions (id, user_id, recipe_id, current_step, chat_history JSONB)
# - user_conversations (id, session_id, role, message, timestamp)
#
# INDEXES:
# - Vector index on recipe embeddings and recipe_steps embeddings for semantic search.
#
# =========================
# DEVELOPMENT INSTRUCTIONS:
# =========================
# - Step 1: Add pgvector extension to PostgreSQL and update DB schema with VECTOR columns + indexes.
# - Step 2: Implement embedding generation with SQLAlchemy ORM events when a recipe is inserted.
# - Step 3: Build hybrid retrieval function with SQLAlchemy queries for structured + semantic filtering.
# - Step 4: Integrate LangChain RetrievalQA using the hybrid retriever.
# - Step 5: Create FastAPI endpoints:
#       /ask (POST) - input: user message, output: AI response (+ audio if requested)
#       /start_session (POST) - input: recipe_id, output: session_id
# - Step 6: Connect frontend React chat UI to /ask endpoint.
# - Step 7: Add Whisper STT for voice input and TTS for output.
# - Step 8: Test session memory and retrieval accuracy.
#
# =========================
# PROMPT ENGINEERING RULES:
# =========================
# 1. Always include the current recipe title, step, and ingredients in AI prompt context.
# 2. Always use few-shot prompting to demonstrate how the assistant should answer cooking questions.
# 3. Apply chain-of-thought prompting internally to improve reasoning (do not expose raw reasoning).
# 4. Use dynamic prompt templates to insert recipe details and current step.
#
# End of Master Prompt
# ===============================================
