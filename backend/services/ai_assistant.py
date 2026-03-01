import logging
import os
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
import openai
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain.retrievers import ParentDocumentRetriever
from langchain.schema import Document
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.db_models import (
    Ingredient,
    Instruction,
    Recipe,
    UserConversation,
    UserSession,
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY not found in environment variables!")
    raise ValueError("OPENAI_API_KEY environment variable is required")
else:
    logger.info("OpenAI API key loaded successfully")
    openai.api_key = openai_api_key

# Initialize embeddings model
try:
    logger.info("Initializing OpenAI embeddings model...")
    embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=1536)
    logger.info("OpenAI embeddings model initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize embeddings model: {e}")
    raise

# Initialize chat model
try:
    logger.info("Initializing OpenAI chat model...")
    chat_model = ChatOpenAI(model="gpt-4o-mini", temperature=0.7) #max_tokens?
    logger.info("OpenAI chat model initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize chat model: {e}")
    raise

# Text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,  # Small chunks for precise retrieval
    chunk_overlap=20,  # Small overlap to maintain context
    length_function=len,
    separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
)

# Maximum conversation history per session (to prevent token limit issues)
# Decision: Keep last 20 messages (10 exchanges) to balance context vs token usage
MAX_CONVERSATION_HISTORY = 20


class AIAssistantService:
    def __init__(self):
        self.embeddings_model = embeddings_model
        self.chat_model = chat_model
        self.text_splitter = text_splitter

    def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for a given text using OpenAI's text-embedding-3-small"""
        try:
            embedding = self.embeddings_model.embed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def chunk_text(self, text: str) -> List[str]:
        """Split text into meaningful chunks for better retrieval"""
        return self.text_splitter.split_text(text)

    def update_recipe_embeddings(self, db: Session, recipe_id: int):
        """Update embeddings for a recipe and all its components"""
        try:
            recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
            if not recipe:
                raise ValueError(f"Recipe {recipe_id} not found")

            # Generate recipe-level embedding
            recipe_text = f"Recipe: {recipe.title}"
            if recipe.description:
                recipe_text += f"\nDescription: {recipe.description}"

            recipe.embedding = np.array(self.generate_embeddings(recipe_text))  # type: ignore

            # Update ingredient embeddings
            ingredients = (
                db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).all()
            )
            for ingredient in ingredients:
                ingredient.embedding = np.array(
                    self.generate_embeddings(f"Ingredient: {ingredient.ingredient}")
                )  # type: ignore

            # Update instruction embeddings
            instructions = (
                db.query(Instruction).filter(Instruction.recipe_id == recipe_id).all()
            )
            for i, instruction in enumerate(instructions):
                # Add step number for better context
                instruction_text = f"Step {i+1}: {instruction.description}"
                instruction.embedding = np.array(
                    self.generate_embeddings(instruction_text)
                )  # type: ignore
                instruction.step_number = int(i + 1)  # type: ignore

            db.commit()
            logger.info(f"Updated embeddings for recipe {recipe_id}")

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating recipe embeddings: {e}")
            raise

    def hybrid_retrieve(
        self, db: Session, recipe_id: int, query: str, top_k: int = 8
    ) -> List[Dict]:
        """
        Hybrid retrieval: Combine structured filtering (by recipe_id) with semantic search
        Returns top_k most relevant chunks from the specified recipe
        """
        try:
            # Generate query embedding and convert to numpy array
            query_embedding = np.array(self.generate_embeddings(query))

            # Retrieve relevant ingredients
            ingredient_results = (
                db.query(Ingredient)
                .filter(
                    Ingredient.recipe_id == recipe_id, Ingredient.embedding.isnot(None)
                )
                .order_by(Ingredient.embedding.cosine_distance(query_embedding))
                .limit(top_k // 2)
                .all()
            )

            # Retrieve relevant instructions
            instruction_results = (
                db.query(Instruction)
                .filter(
                    Instruction.recipe_id == recipe_id,
                    Instruction.embedding.isnot(None),
                )
                .order_by(Instruction.embedding.cosine_distance(query_embedding))
                .limit(top_k // 2)
                .all()
            )

            # Combine and format results
            results = []

            for ingredient in ingredient_results:
                results.append(
                    {
                        "type": "ingredient",
                        "content": ingredient.ingredient,
                        "id": ingredient.id,
                        "similarity_score": self._calculate_similarity(
                            query_embedding, ingredient.embedding
                        ),
                    }
                )

            for instruction in instruction_results:
                results.append(
                    {
                        "type": "instruction",
                        "content": instruction.description,
                        "step_number": instruction.step_number,
                        "id": instruction.id,
                        "similarity_score": self._calculate_similarity(
                            query_embedding, instruction.embedding
                        ),
                    }
                )

            # Sort by similarity score and return top_k
            results.sort(key=lambda x: float(x["similarity_score"]), reverse=True)  # type: ignore
            return results[:top_k]

        except Exception as e:
            logger.error(f"Error in hybrid retrieval: {e}")
            raise

    def _calculate_similarity(self, embedding1, embedding2) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            # Convert to numpy arrays for efficient calculation
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)

            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0

    def create_cooking_context(
        self, db: Session, recipe_id: int, retrieved_chunks: List[Dict]
    ) -> str:
        """Create context string from retrieved chunks for AI prompt"""
        try:
            recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
            if not recipe:
                return ""

            context_parts = [f"Recipe: {recipe.title}"]

            if recipe.description:
                context_parts.append(f"Description: {recipe.description}")

            # Add retrieved chunks
            for chunk in retrieved_chunks:
                if chunk["type"] == "ingredient":
                    context_parts.append(f"Ingredient: {chunk['content']}")
                elif chunk["type"] == "instruction":
                    context_parts.append(
                        f"Step {chunk['step_number']}: {chunk['content']}"
                    )

            return "\n".join(context_parts)

        except Exception as e:
            logger.error(f"Error creating cooking context: {e}")
            return ""

    def get_conversation_history(
        self, db: Session, session_id: str, limit: int = MAX_CONVERSATION_HISTORY
    ) -> List[Dict]:
        """Get recent conversation history for context"""
        try:
            conversations = (
                db.query(UserConversation)
                .filter(UserConversation.session_id == session_id)
                .order_by(UserConversation.timestamp.desc())
                .limit(limit)
                .all()
            )

            # Return in chronological order (oldest first)
            return [
                {
                    "role": conv.role,
                    "message": conv.message,
                    "timestamp": conv.timestamp,
                }
                for conv in reversed(conversations)
            ]

        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []

    def generate_ai_response(
        self, query: str, context: str, conversation_history: List[Dict]
    ) -> str:
        """Generate AI response using LangChain with context and conversation history"""
        try:
            # Create system prompt
            system_prompt = """You are an AI chef assistant helping someone cook a recipe. You have access to the recipe details and conversation history.

IMPORTANT RULES:
1. Always be helpful, encouraging, and precise in your cooking advice
2. If the user asks about something not in the recipe context, politely redirect them to the recipe
3. Keep responses concise but informative
4. Use cooking terminology appropriately
5. If you're unsure about something, suggest they check the recipe or ask for clarification

Current Recipe Context:
{context}

Conversation History:
{history}

User Question: {question}

Please provide a helpful response:"""

            # Format conversation history
            history_text = ""
            for conv in conversation_history[-10:]:  # Last 10 messages for context
                history_text += f"{conv['role'].title()}: {conv['message']}\n"

            # Create prompt template
            prompt = ChatPromptTemplate.from_template(system_prompt)

            # Create chain
            chain = (
                {
                    "context": lambda x: x["context"],
                    "history": lambda x: x["history"],
                    "question": lambda x: x["question"],
                }
                | prompt
                | self.chat_model
                | StrOutputParser()
            )

            # Generate response
            response = chain.invoke(
                {"context": context, "history": history_text, "question": query}
            )

            return response.strip()

        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return "I'm sorry, I'm having trouble processing your request right now. Please try again."

    def moderate_content(self, text: str) -> bool:
        """Check if content is appropriate using OpenAI moderation API"""
        try:
            response = openai.moderations.create(input=text)
            return not response.results[0].flagged
        except Exception as e:
            logger.error(f"Error in content moderation: {e}")
            # If moderation fails, allow the content (fail-safe)
            return True

    def create_session(self, db: Session, user_id: int, recipe_id: int) -> str:
        """Create a new cooking session"""
        try:
            session_id = str(uuid.uuid4())

            # Check if user already has an active session for this recipe
            existing_session = (
                db.query(UserSession)
                .filter(
                    UserSession.user_id == user_id,
                    UserSession.recipe_id == recipe_id,
                    UserSession.is_active == True,
                )
                .first()
            )

            if existing_session:
                # Deactivate existing session
                existing_session.is_active = bool(False)  # type: ignore

            # Create new session
            new_session = UserSession(
                user_id=user_id,
                recipe_id=recipe_id,
                session_id=session_id,
                current_step=1,
                is_active=True,
            )

            db.add(new_session)
            db.commit()

            logger.info(
                f"Created new session {session_id} for user {user_id} and recipe {recipe_id}"
            )
            return session_id

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating session: {e}")
            raise

    def log_conversation(
        self,
        db: Session,
        session_id: str,
        role: str,
        message: str,
        query_type: Optional[str] = None,
        response_time_ms: Optional[int] = None,
    ):
        """Log conversation for analytics and debugging"""
        try:
            conversation = UserConversation(
                session_id=session_id,
                role=role,
                message=message,
                query_type=query_type,
                response_time_ms=response_time_ms,
            )

            db.add(conversation)
            db.commit()

        except Exception as e:
            logger.error(f"Error logging conversation: {e}")
            # Don't raise here as logging failure shouldn't break the main flow

    def cleanup_inactive_sessions(self, db: Session, hours_inactive: int = 24):
        """Clean up sessions that have been inactive for specified hours"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours_inactive)

            inactive_sessions = (
                db.query(UserSession)
                .filter(
                    UserSession.is_active == True, UserSession.updated_at < cutoff_time
                )
                .all()
            )

            for session in inactive_sessions:
                session.is_active = bool(False)  # type: ignore

            db.commit()
            logger.info(f"Cleaned up {len(inactive_sessions)} inactive sessions")

        except Exception as e:
            logger.error(f"Error cleaning up inactive sessions: {e}")
            db.rollback()

    def extract_current_step(self, ai_response: str, current_step: int) -> int:
        """Extract current step from AI response if it mentions step changes"""
        try:
            # Look for step-related patterns in the AI response
            import re

            # Patterns that might indicate step changes
            step_patterns = [
                r"step (\d+)",
                r"step (\d+) of",
                r"now on step (\d+)",
                r"moving to step (\d+)",
                r"next step is (\d+)",
                r"step (\d+) is",
            ]

            for pattern in step_patterns:
                match = re.search(pattern, ai_response.lower())
                if match:
                    new_step = int(match.group(1))
                    if 1 <= new_step <= 20:  # Reasonable step range
                        logger.info(f"Extracted step {new_step} from AI response")
                        return new_step

            # If no step change detected, return current step
            return current_step

        except Exception as e:
            logger.error(f"Error extracting current step: {e}")
            return current_step


# Global instance
try:
    logger.info("Creating AI assistant service instance...")
    ai_assistant = AIAssistantService()
    logger.info("AI assistant service created successfully")
except Exception as e:
    logger.error(f"Failed to create AI assistant service: {e}")
    raise
