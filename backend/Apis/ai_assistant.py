import io
import logging
import os
import tempfile
import time
from typing import List, Optional

import openai
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import Recipe, User, UserSession
from backend.services.ai_assistant import ai_assistant
from backend.services.subscription_service import (
    check_ai_session_limit,
    increment_session_usage,
)
from backend.services.tts_service import tts_service

# Configure logging
logger = logging.getLogger(__name__)

# Configure OpenAI API key for audio transcription
load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai.api_key = openai_api_key
else:
    logger.error("OPENAI_API_KEY not found in environment variables!")

router = APIRouter()


# Pydantic models for request/response
class StartSessionRequest(BaseModel):
    recipe_id: int


class StartSessionResponse(BaseModel):
    session_id: str
    recipe_title: str
    message: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    query_type: Optional[str] = None  # For analytics


class ChatResponse(BaseModel):
    response: str
    session_id: str
    current_step: int
    audio_url: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "21m00Tcm4TlvDq8ikWAM"  # Default ElevenLabs voice


class SessionInfo(BaseModel):
    session_id: str
    recipe_title: str
    current_step: int
    is_active: bool


# OpenAI client is already initialized in ai_assistant service


@router.post("/start_session", response_model=StartSessionResponse)
async def start_cooking_session(
    request: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new cooking session for a recipe"""
    try:
        logger.info(
            f"Starting cooking session for recipe {request.recipe_id} by user {current_user.id}"
        )

        # Verify recipe exists and user has access
        recipe = db.query(Recipe).filter(Recipe.id == request.recipe_id).first()
        if not recipe:
            logger.error(f"Recipe {request.recipe_id} not found")
            raise HTTPException(status_code=404, detail="Recipe not found")

        logger.info(f"Found recipe: {recipe.title}")

        # Check if recipe has embeddings (if not, generate them asynchronously)
        if recipe.embedding is None or getattr(recipe.embedding, "size", 0) == 0:
            logger.info(f"Generating embeddings for recipe {request.recipe_id}")
            try:
                # Generate embeddings asynchronously to avoid blocking the session start
                def generate_embeddings_async():
                    try:
                        from backend.database.database import SessionLocal

                        background_db = SessionLocal()
                        try:
                            ai_assistant.update_recipe_embeddings(
                                background_db, request.recipe_id
                            )
                            logger.info(
                                f"Successfully generated embeddings for recipe {request.recipe_id}"
                            )
                        finally:
                            background_db.close()
                    except Exception as e:
                        logger.error(
                            f"Failed to generate embeddings for recipe {request.recipe_id}: {e}"
                        )

                # Start embeddings generation in a background thread
                import threading

                threading.Thread(target=generate_embeddings_async, daemon=True).start()

            except Exception as e:
                logger.error(
                    f"Failed to start embeddings generation for recipe {request.recipe_id}: {e}"
                )
                # Don't fail the session start if embeddings generation fails
        else:
            logger.info(f"Recipe {request.recipe_id} already has embeddings")

        # Create new session
        logger.info(
            f"Creating session for user {current_user.id} and recipe {request.recipe_id}"
        )
        session_id = ai_assistant.create_session(db, int(current_user.id), int(request.recipe_id))
        logger.info(f"Created session {session_id}")

        # Get session info
        session = (
            db.query(UserSession).filter(UserSession.session_id == session_id).first()
        )

        logger.info(
            f"Successfully started cooking session {session_id} for {recipe.title}"
        )
        return StartSessionResponse(
            session_id=session_id,
            recipe_title=str(recipe.title),
            message=f"Started cooking session for {recipe.title}. Say 'Hey Cheffy' to ask me anything about the recipe!",
        )

    except Exception as e:
        logger.error(f"Error starting session: {e}")
        import traceback

        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", response_model=ChatResponse)
async def ask_ai_assistant(
    request: ChatRequest,
    current_user: User = Depends(check_ai_session_limit),
    db: Session = Depends(get_db),
):
    """Ask the AI assistant a question about the current recipe"""
    start_time = time.time()

    try:
        # Increment session usage (only for non-premium users)
        increment_session_usage(db, current_user.id)
        # Verify session exists and belongs to user
        session = (
            db.query(UserSession)
            .filter(
                UserSession.session_id == request.session_id,
                UserSession.user_id == current_user.id,
                UserSession.is_active == True,
            )
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found or inactive")

        # Content moderation
        if not ai_assistant.moderate_content(request.message):
            raise HTTPException(
                status_code=400, detail="Content violates community guidelines"
            )

        # Log user message
        ai_assistant.log_conversation(
            db, request.session_id, "user", request.message, request.query_type
        )

        # Retrieve relevant context
        retrieved_chunks = ai_assistant.hybrid_retrieve(
            db, int(session.recipe_id), request.message, top_k=8
        )

        # Create cooking context
        context = ai_assistant.create_cooking_context(
            db, int(session.recipe_id), retrieved_chunks
        )

        # Get conversation history
        conversation_history = ai_assistant.get_conversation_history(
            db, request.session_id
        )

        # Generate AI response
        ai_response = ai_assistant.generate_ai_response(
            request.message, context, conversation_history
        )

        # Generate TTS audio
        audio_url = None
        try:
            logger.info("Generating TTS audio for text response")
            
            # Check if TTS service is available
            if not tts_service.is_available:
                logger.warning("TTS service is not available. Check ELEVENLABS_API_KEY configuration.")
            else:
                audio_url = await tts_service.generate_audio_url(ai_response)
                if audio_url:
                    logger.info(f"TTS audio URL generated (text): {audio_url}")
                else:
                    logger.warning("TTS service returned None for audio_url. Check logs for errors.")
        except Exception as e:
            logger.error(f"Failed to generate TTS audio (text): {e}", exc_info=True)
            logger.warning(
                "TTS service may not be properly configured (missing ELEVENLABS_API_KEY) or API call failed"
            )

        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)

        # Log AI response
        ai_assistant.log_conversation(
            db,
            request.session_id,
            "assistant",
            ai_response,
            "ai_response",
            response_time_ms,
        )

        # Update session step if needed
        current_step = ai_assistant.extract_current_step(
            ai_response, int(session.current_step)
        )
        if current_step != session.current_step:
            session.current_step = int(current_step)  # type: ignore
            db.commit()

        logger.info(f"AI response generated in {response_time_ms}ms")

        return ChatResponse(
            response=ai_response,
            session_id=request.session_id,
            current_step=current_step,
            audio_url=audio_url,
        )

    except Exception as e:
        logger.error(f"Error in AI assistant: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload_audio")
async def process_audio_input(
    session_id: str = Form(...),
    audio_file: UploadFile = File(...),
    current_user: User = Depends(check_ai_session_limit),
    db: Session = Depends(get_db),
):
    """Process audio input and convert to text for AI assistant"""
    try:
        # Increment session usage (only for non-premium users)
        increment_session_usage(db, current_user.id)
        logger.info(
            f"Processing audio upload for session {session_id} by user {current_user.id}"
        )

        # Verify session exists and belongs to user
        session = (
            db.query(UserSession)
            .filter(
                UserSession.session_id == session_id,
                UserSession.user_id == current_user.id,
                UserSession.is_active == True,
            )
            .first()
        )

        if not session:
            logger.error(
                f"Session {session_id} not found or inactive for user {current_user.id}"
            )
            raise HTTPException(status_code=404, detail="Session not found or inactive")

        logger.info(f"Found active session for recipe {session.recipe_id}")

        # Validate audio file
        if not audio_file.filename or not audio_file.filename.lower().endswith((".wav", ".mp3", ".m4a", ".flac")):
            logger.error(f"Unsupported audio format: {audio_file.filename}")
            raise HTTPException(status_code=400, detail="Unsupported audio format")

        logger.info(
            f"Processing audio file: {audio_file.filename}, size: {audio_file.size} bytes"
        )

        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        logger.info(f"Audio file saved to temporary location: {temp_file_path}")

        try:
            # Transcribe audio using OpenAI's Whisper API
            logger.info("Starting audio transcription with OpenAI Whisper")
            with open(temp_file_path, "rb") as audio_file:
                result = openai.audio.transcriptions.create(
                    model="whisper-1", file=audio_file, response_format="text"
                )  # type: ignore
            transcribed_text = str(result).strip()

            logger.info(f"Transcription completed: '{transcribed_text}'")

            if not transcribed_text:
                logger.error("Empty transcription result")
                raise HTTPException(
                    status_code=400, detail="Could not transcribe audio"
                )

            # Content moderation
            logger.info("Running content moderation")
            if not ai_assistant.moderate_content(transcribed_text):
                logger.warning(f"Content moderation failed for: {transcribed_text}")
                raise HTTPException(
                    status_code=400, detail="Content violates community guidelines"
                )

            # Process the transcribed text through the AI assistant
            start_time = time.time()

            # Log user message
            ai_assistant.log_conversation(
                db, session_id, "user", transcribed_text, "voice_query"
            )

            # Retrieve relevant context
            retrieved_chunks = ai_assistant.hybrid_retrieve(
                db, int(session.recipe_id), transcribed_text, top_k=8
            )

            # Create cooking context
            context = ai_assistant.create_cooking_context(
                db, int(session.recipe_id), retrieved_chunks
            )

            # Get conversation history
            conversation_history = ai_assistant.get_conversation_history(db, session_id)

            # Generate AI response
            ai_response = ai_assistant.generate_ai_response(
                transcribed_text, context, conversation_history
            )

            # Generate TTS audio
            audio_url = None
            try:
                logger.info("Generating TTS audio for voice response")
                
                # Check if TTS service is available
                if not tts_service.is_available:
                    logger.warning("TTS service is not available. Check ELEVENLABS_API_KEY configuration.")
                else:
                    audio_url = await tts_service.generate_audio_url(ai_response)
                    if audio_url:
                        logger.info(f"TTS audio URL generated (voice): {audio_url}")
                    else:
                        logger.warning("TTS service returned None for audio_url. Check logs for errors.")
            except Exception as e:
                logger.error(f"Failed to generate TTS audio (voice): {e}", exc_info=True)
                logger.warning(
                    "TTS service may not be properly configured (missing ELEVENLABS_API_KEY) or API call failed"
                )

            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)

            # Log AI response
            ai_assistant.log_conversation(
                db,
                session_id,
                "assistant",
                ai_response,
                "voice_response",
                response_time_ms,
            )

            # Update session step if needed
            current_step = ai_assistant.extract_current_step(
                ai_response, int(session.current_step)
            )
            if current_step != session.current_step:
                session.current_step = int(current_step)  # type: ignore
                db.commit()

            logger.info(f"Voice query processed successfully in {response_time_ms}ms")

            return {
                "transcribed_text": transcribed_text,
                "response": ai_response,
                "audio_url": audio_url,
                "current_step": current_step,
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")

    except Exception as e:
        logger.error(f"Error processing audio: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ElevenLabs TTS endpoints
@router.post("/tts")
async def generate_tts(
    request: TTSRequest, current_user: User = Depends(get_current_user)
):
    """Generate TTS audio for given text using ElevenLabs"""
    try:
        audio_data = await tts_service.generate_audio(request.text, request.voice_id)

        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=tts_response.mp3"},
        )
    except Exception as e:
        logger.error(f"Error generating TTS: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate audio")


@router.get("/tts/stream/{response_id}")
async def get_tts_stream(response_id: str):
    """Get streaming TTS audio for a specific response"""
    try:
        audio_data = await tts_service.get_cached_audio(response_id)

        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=tts_stream.mp3"},
        )
    except Exception as e:
        logger.error(f"Error getting TTS stream: {e}")
        raise HTTPException(status_code=404, detail="Audio not found")


@router.get("/tts/status")
async def get_tts_status(current_user: User = Depends(get_current_user)):
    """Check TTS service status and configuration"""
    try:
        status = tts_service.get_status()
        return {
            "is_available": status.get("is_available", False),
            "has_api_key": bool(os.getenv("ELEVENLABS_API_KEY")),
            "redis_available": status.get("redis_available", False),
            "message": "TTS service is available" if status.get("is_available") else "TTS service is not available. Check ELEVENLABS_API_KEY configuration."
        }
    except Exception as e:
        logger.error(f"Error getting TTS status: {e}")
        return {
            "is_available": False,
            "has_api_key": False,
            "redis_available": False,
            "message": f"Error checking TTS status: {str(e)}"
        }


# Session management endpoints
@router.get("/sessions", response_model=List[SessionInfo])
async def get_user_sessions(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all active sessions for the current user"""
    try:
        sessions = (
            db.query(UserSession)
            .filter(
                UserSession.user_id == current_user.id, UserSession.is_active == True
            )
            .all()
        )

        session_info = []
        for session in sessions:
            recipe = db.query(Recipe).filter(Recipe.id == session.recipe_id).first()
            session_info.append(
                SessionInfo(
                    session_id=str(session.session_id),
                    recipe_title=str(recipe.title) if recipe else "Unknown Recipe",
                    current_step=int(session.current_step),
                    is_active=bool(session.is_active),
                )
            )

        return session_info
    except Exception as e:
        logger.error(f"Error getting user sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}/step")
async def update_session_step(
    session_id: str,
    step: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current step for a session"""
    try:
        session = (
            db.query(UserSession)
            .filter(
                UserSession.session_id == session_id,
                UserSession.user_id == current_user.id,
                UserSession.is_active == True,
            )
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.current_step = int(step)  # type: ignore
        db.commit()

        return {"message": "Step updated successfully"}
    except Exception as e:
        logger.error(f"Error updating session step: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End a cooking session"""
    try:
        session = (
            db.query(UserSession)
            .filter(
                UserSession.session_id == session_id,
                UserSession.user_id == current_user.id,
                UserSession.is_active == True,
            )
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.is_active = bool(False)  # type: ignore
        session.ended_at = time.time()
        db.commit()

        return {"message": "Session ended successfully"}
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-sessions")
async def cleanup_inactive_sessions(
    hours_inactive: int = 24, db: Session = Depends(get_db)
):
    """Clean up inactive sessions (admin endpoint)"""
    try:
        ai_assistant.cleanup_inactive_sessions(db, hours_inactive)
        return {"message": f"Cleaned up sessions inactive for {hours_inactive} hours"}
    except Exception as e:
        logger.error(f"Error cleaning up sessions: {e}")
        raise HTTPException(status_code=500, detail="Error cleaning up sessions")
