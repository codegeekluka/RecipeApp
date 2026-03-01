import asyncio
import re
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.sql import func

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import (
    Ingredient,
    Instruction,
    Recipe,
    RecipeNote,
    Tag,
    User,
    UserTag,
)
from backend.Scrapers.scraper import extract_webpage_data
from backend.services.ai_assistant import ai_assistant

# Error message constants
RECIPE_NOT_FOUND = "Recipe not found"
NOT_ALLOWED_TO_EDIT = "Not allowed to edit this recipe"
NOT_ALLOWED_TO_DELETE = "Not allowed to delete this recipe"
TAG_NOT_FOUND = "Tag not found"
TAG_ALREADY_EXISTS = "Tag already exists"
CANNOT_DELETE_DEFAULT_TAGS = "Cannot delete default tags"

# creates new router instance
router = APIRouter()


class RecipeRequest(BaseModel):
    url: str


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    ingredients: Optional[List[str]] = None
    instructions: Optional[List[str]] = None
    is_active: Optional[bool] = False
    favorite: Optional[bool] = False
    tags: Optional[List[str]] = None
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    total_time: Optional[str] = None


class TagsUpdate(BaseModel):
    tags: List[str]


class UserTagCreate(BaseModel):
    tag_name: str


class UserTagResponse(BaseModel):
    tag_name: str
    is_default: bool


def generate_unique_slug(db: Session, title: str) -> str:
    base_slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    slug = base_slug
    count = 1

    while db.query(Recipe).filter(Recipe.slug == slug).first() is not None:
        slug = f"{base_slug}-{count}"
        count += 1

    return slug


def _is_how_to_section(item):
    """Check if the item is a HowToSection"""
    return isinstance(item, dict) and item.get("@type") == "HowToSection"


def _is_how_to_step(item):
    """Check if the item is a HowToStep"""
    return isinstance(item, dict) and item.get("@type") == "HowToStep"


def _extract_section_steps(section_item):
    """Extract steps from a HowToSection"""
    steps = []
    section_name = section_item.get("name")
    if section_name:
        steps.append(f"## {section_name}")  # Markdown-style header
    
    section_items = section_item.get("itemListElement", [])
    steps.extend(extract_instruction_texts(section_items))
    return steps


def _extract_step_text(step_item):
    """Extract text from a HowToStep"""
    text = step_item.get("text")
    return text if text else None


def extract_instruction_texts(instructions):
    """Extract instruction texts from various formats"""
    if isinstance(instructions, str):
        return [instructions]

    steps = []
    for item in instructions:
        if _is_how_to_section(item):
            steps.extend(_extract_section_steps(item))
        elif _is_how_to_step(item):
            step_text = _extract_step_text(item)
            if step_text:
                steps.append(step_text)
        elif isinstance(item, str):
            steps.append(item)

    return steps


def _handle_scraper_error(recipe):
    """Handle scraper error messages and raise appropriate ValueError"""
    if not isinstance(recipe, str):
        return
    
    error_messages = {
        "No HowToSteps found.": "No recipe found on this page. Please check if the URL contains a recipe.",
        "Failed to retrieve data.": "Failed to access the website. Please check the URL and try again.",
    }
    
    # Check exact matches first
    if recipe in error_messages:
        raise ValueError(error_messages[recipe])
    
    # Check partial matches
    recipe_lower = recipe.lower()
    if "timed out" in recipe_lower:
        raise ValueError("The website took too long to respond. Please try again later.")
    elif "connection error" in recipe_lower:
        raise ValueError("Connection error. Please check your internet connection and try again.")
    elif "request failed" in recipe_lower:
        raise ValueError("Failed to access the website. The site may be blocking automated requests.")
    elif "unexpected error" in recipe_lower:
        raise ValueError("An unexpected error occurred while scraping. Please try again.")
    else:
        raise ValueError(f"Scraping failed: {recipe}")


def _validate_recipe_data(recipe):
    """Validate that we have the required recipe data"""
    if not isinstance(recipe, dict) or "name" not in recipe:
        raise ValueError("Invalid recipe data received from the website.")


def _extract_image_url(image_data):
    """Extract image URL from various image data formats"""
    if isinstance(image_data, dict):
        return image_data.get("url", "")
    elif isinstance(image_data, list) and image_data:
        first = image_data[0]
        return first.get("url", "") if isinstance(first, dict) else first
    elif isinstance(image_data, str):
        return image_data
    else:
        return ""


def _create_recipe_object(recipe, slug, current_user):
    """Create and return a new Recipe object"""
    image = _extract_image_url(recipe.get("image", ""))
    
    return Recipe(
        title=recipe["name"],
        slug=slug,
        user_id=current_user.id,
        description=recipe.get("description", ""),
        image=image,
        favorite=False,
        is_active=False,
        tags=[],
        prep_time=recipe.get("prep_time"),
        cook_time=recipe.get("cook_time"),
        total_time=recipe.get("total_time"),
    )


def _add_instructions_to_db(recipe, new_recipe, db):
    """Add instructions to the database"""
    instructions = recipe.get("recipeInstructions", [])
    step_texts = extract_instruction_texts(instructions)
    
    if not step_texts:
        raise ValueError("No valid instructions found in the recipe. Please try a different recipe URL.")
    
    for i, step_text in enumerate(step_texts):
        db.add(
            Instruction(
                description=step_text, recipe_id=new_recipe.id, step_number=i + 1
            )
        )


def _add_ingredients_to_db(recipe, new_recipe, db):
    """Add ingredients to the database"""
    ingredients = recipe.get("recipeIngredient", [])
    if not ingredients:
        raise ValueError("No ingredients found in the recipe. Please try a different recipe URL.")
    
    for item in ingredients:
        db.add(Ingredient(ingredient=item, recipe_id=new_recipe.id))


def _generate_embeddings_async(recipe_id):
    """Generate embeddings for the recipe in a background thread"""
    def generate_embeddings_async():
        try:
            from backend.database.database import SessionLocal
            background_db = SessionLocal()
            try:
                ai_assistant.update_recipe_embeddings(background_db, recipe_id)
                print(f"Successfully generated embeddings for recipe {recipe_id}")
            finally:
                background_db.close()
        except Exception as e:
            print(f"Warning: Failed to generate embeddings for recipe {recipe_id}: {e}")

    threading.Thread(target=generate_embeddings_async, daemon=True).start()


# when defining endpoints, FastAPI app must be ware of these
@router.post("/RecipePage")
def parse_recipe(
    req: RecipeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        recipe = extract_webpage_data(req.url)
        
        # Handle scraper errors early
        _handle_scraper_error(recipe)
        
        # Validate recipe data
        _validate_recipe_data(recipe)
        
        # Create recipe object
        slug = generate_unique_slug(db, recipe["name"])
        new_recipe = _create_recipe_object(recipe, slug, current_user)
        db.add(new_recipe)
        db.flush()  # Assigns recipe.id
        
        # Add instructions and ingredients
        _add_instructions_to_db(recipe, new_recipe, db)
        _add_ingredients_to_db(recipe, new_recipe, db)
        
        db.commit()
        
        # Generate embeddings asynchronously
        _generate_embeddings_async(new_recipe.id)
        
        return {"recipe_id": new_recipe.id, "slug": slug}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error during recipe parsing: {e}")
        raise HTTPException(
            status_code=500, detail="An unexpected error occurred. Please try again."
        )


@router.get("/recipes/{slug}")
def get_recipe_by_slug(slug: str, db: Session = Depends(get_db)):
    # Optimized: Use selectinload for better performance with collections
    recipe = (
        db.query(Recipe)
        .options(
            selectinload(Recipe.tags),
            selectinload(Recipe.ingredient_list),
            selectinload(Recipe.instruction_list)
        )
        .filter(Recipe.slug == slug)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

    return {
        "title": recipe.title,
        "slug": recipe.slug,
        "description": recipe.description,
        "image": recipe.image,
        "ingredients": [i.ingredient for i in recipe.ingredient_list],
        "instructions": [step.description for step in recipe.instruction_list],
        "is_favorite": recipe.favorite,
        "is_active": recipe.is_active,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "total_time": recipe.total_time,
        "tags": [tag.name for tag in recipe.tags],
    }


@router.get("/user/recipes")
def get_user_recipes(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    full_details: bool = False  # Optional parameter for full recipe details
):
    try:
        if full_details:
            # Full recipe details (slower, only when requested)
            user_recipes = (
                db.query(Recipe)
                .options(
                    selectinload(Recipe.tags),
                    selectinload(Recipe.ingredient_list),
                    selectinload(Recipe.instruction_list)
                )
                .filter(Recipe.user_id == current_user.id)
                .all()
            )
            
            recipes_data = []
            for recipe in user_recipes:
                recipes_data.append({
                    "title": recipe.title,
                    "slug": recipe.slug,
                    "id": recipe.id,
                    "description": recipe.description,
                    "image": recipe.image,
                    "favorite": recipe.favorite,
                    "is_active": recipe.is_active,
                    "prep_time": recipe.prep_time,
                    "cook_time": recipe.cook_time,
                    "total_time": recipe.total_time,
                    "tags": [tag.name for tag in recipe.tags],
                    "ingredients": [i.ingredient for i in recipe.ingredient_list],
                    "instructions": [step.description for step in recipe.instruction_list],
                })
        else:
            # Lightweight recipe list (fast, default behavior)
            user_recipes = (
                db.query(Recipe)
                .options(selectinload(Recipe.tags))  # Only load tags, skip heavy data
                .filter(Recipe.user_id == current_user.id)
                .all()
            )
            
            recipes_data = []
            for recipe in user_recipes:
                recipes_data.append({
                    "title": recipe.title,
                    "slug": recipe.slug,
                    "id": recipe.id,
                    "description": recipe.description,
                    "image": recipe.image,
                    "favorite": recipe.favorite,
                    "is_active": recipe.is_active,
                    "prep_time": recipe.prep_time,
                    "cook_time": recipe.cook_time,
                    "total_time": recipe.total_time,
                    "tags": [tag.name for tag in recipe.tags],
                    # Note: ingredients and instructions excluded for performance
                })
        
        return {"recipes": recipes_data}
    except Exception as e:
        print("Error fetching recipes: ", e)
        return JSONResponse(status_code=500, content={"detail": "Server error"})


# Updating Recipe information:
@router.put("/recipes/{slug}")
def update_recipe(
    slug: str,
    updated_data: RecipeUpdate,  # Expect title, description, ingredients, instructions
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    db_recipe = db.query(Recipe).filter(Recipe.slug == slug).first()

    if not db_recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)
    if db_recipe.user_id != user.id:
        raise HTTPException(status_code=403, detail=NOT_ALLOWED_TO_EDIT)

    # Update only provided fields
    if updated_data.title is not None:
        db_recipe.title = str(updated_data.title)  # type: ignore
    if updated_data.description is not None:
        db_recipe.description = str(updated_data.description)  # type: ignore
    if updated_data.prep_time is not None:
        db_recipe.prep_time = str(updated_data.prep_time)  # type: ignore
    if updated_data.cook_time is not None:
        db_recipe.cook_time = str(updated_data.cook_time)  # type: ignore
    if updated_data.total_time is not None:
        db_recipe.total_time = str(updated_data.total_time)  # type: ignore

    if updated_data.ingredients is not None:
        db.query(Ingredient).filter(Ingredient.recipe_id == db_recipe.id).delete()
        for item in updated_data.ingredients:
            db.add(Ingredient(recipe_id=db_recipe.id, ingredient=item))

    if updated_data.instructions is not None:
        db.query(Instruction).filter(Instruction.recipe_id == db_recipe.id).delete()
        for i, step in enumerate(updated_data.instructions):
            db.add(
                Instruction(recipe_id=db_recipe.id, description=step, step_number=i + 1)
            )

    db.commit()
    db.refresh(db_recipe)

    # Update embeddings for the modified recipe asynchronously
    def update_embeddings_async():
        try:
            # Create a new database session for the background task
            from backend.database.database import SessionLocal

            background_db = SessionLocal()
            try:
                ai_assistant.update_recipe_embeddings(background_db, db_recipe.id)
                print(f"Successfully updated embeddings for recipe {db_recipe.id}")
            finally:
                background_db.close()
        except Exception as e:
            print(
                f"Warning: Failed to update embeddings for recipe {db_recipe.id}: {e}"
            )

    # Start embeddings generation in a background thread
    threading.Thread(target=update_embeddings_async, daemon=True).start()

    # Return a dictionary instead of the SQLAlchemy object
    return {
        "id": db_recipe.id,
        "title": db_recipe.title,
        "slug": db_recipe.slug,
        "description": db_recipe.description,
        "image": db_recipe.image,
        "favorite": db_recipe.favorite,
        "is_active": db_recipe.is_active,
        "prep_time": db_recipe.prep_time,
        "cook_time": db_recipe.cook_time,
        "total_time": db_recipe.total_time,
    }


# delete recipe


@router.delete("/recipes/{slug}", status_code=204)
def delete_recipe(
    slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    db_recipe = db.query(Recipe).filter(Recipe.slug == slug).first()

    if not db_recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)
    if db_recipe.user_id != user.id:
        raise HTTPException(status_code=403, detail=NOT_ALLOWED_TO_DELETE)

    # Delete related ingredients and instructions first (if needed)
    db.query(Ingredient).filter(Ingredient.recipe_id == db_recipe.id).delete()
    db.query(Instruction).filter(Instruction.recipe_id == db_recipe.id).delete()

    # Then delete the recipe itself
    db.delete(db_recipe)
    db.commit()

    return {"detail": "Recipe deleted"}


# Add recipe manually:
@router.post("/recipe/manualRecipe")
def create_manual_recipe(
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print("Received recipe_in:", recipe_in.dict())

    try:
        # Generate a unique slug
        slug = generate_unique_slug(db, str(recipe_in.title)) if recipe_in.title else generate_unique_slug(db, "untitled")
        # Create and store the main recipe
        new_recipe = Recipe(
            title=recipe_in.title,
            slug=slug,
            user_id=current_user.id,
            description=recipe_in.description,
            image=recipe_in.image,
            favorite=recipe_in.favorite if recipe_in.favorite is not None else False,
            is_active=recipe_in.is_active if recipe_in.is_active is not None else False,
            tags=[],
            prep_time=recipe_in.prep_time,
            cook_time=recipe_in.cook_time,
            total_time=recipe_in.total_time,
        )
        db.add(new_recipe)
        db.flush()  # Assigns new_recipe.id

        # Add ingredients
        if recipe_in.ingredients:
            for item in recipe_in.ingredients:
                db.add(Ingredient(ingredient=item, recipe_id=new_recipe.id))

        # Add instructions
        if recipe_in.instructions:
            for i, step_text in enumerate(recipe_in.instructions):
                db.add(
                    Instruction(
                        description=step_text, recipe_id=new_recipe.id, step_number=i + 1
                    )
                )
        # Tags
        if recipe_in.tags:
            for tag_name in recipe_in.tags:
                tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.add(tag)
                    db.flush()  # get tag.id assigned
                new_recipe.tags.append(tag)  # link tag with recipe

        db.commit()

        # Generate embeddings for the new recipe asynchronously
        # DISABLED FOR LOAD TESTING - Comment out to avoid OpenAI API calls
        # def generate_embeddings_async():
        #     try:
        #         # Create a new database session for the background task
        #         from backend.database.database import SessionLocal

        #         background_db = SessionLocal()
        #         try:
        #             ai_assistant.update_recipe_embeddings(background_db, new_recipe.id)
        #             print(
        #                 f"Successfully generated embeddings for manual recipe {new_recipe.id}"
        #             )
        #         finally:
        #             background_db.close()
        #     except Exception as e:
        #         print(
        #             f"Warning: Failed to generate embeddings for manual recipe {new_recipe.id}: {e}"
        #         )

        # Start embeddings generation in a background thread
        # threading.Thread(target=generate_embeddings_async, daemon=True).start()

        return {"recipe_id": new_recipe.id, "slug": slug}

    except Exception as e:
        db.rollback()
        print("Error creating recipe:", str(e))
        print(traceback.format_exc())

        raise HTTPException(
            status_code=500, detail=f"Failed to create recipe: {str(e)}"
        )


@router.put("/recipe/{slug}/favorite")
def toggle_favorite(
    slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    # Get current status and toggle in one atomic operation
    recipe = db.query(Recipe.favorite, Recipe.id).filter(
        Recipe.slug == slug, Recipe.user_id == user.id
    ).first()
    
    if not recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)
    
    new_favorite_status = not recipe.favorite
    
    # Single atomic update
    db.query(Recipe).filter(Recipe.slug == slug).update(
        {"favorite": new_favorite_status},
        synchronize_session=False
    )
    
    db.commit()
    return {"slug": slug, "is_favorite": new_favorite_status}


@router.put("/recipe/{slug}/active")
def toggle_active(
    slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    # Optimized: Get current active status first
    current_recipe = db.query(Recipe.is_active).filter(Recipe.slug == slug).first()
    if not current_recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)
    
    new_active_status = not current_recipe.is_active
    
    # If we're activating this recipe, deactivate all other recipes first
    if new_active_status:
        # Optimized: Single update query
        db.query(Recipe).filter(
            Recipe.user_id == user.id, Recipe.is_active == True
        ).update({"is_active": False}, synchronize_session=False)
    
    # Toggle the current recipe's active status
    db.query(Recipe).filter(Recipe.slug == slug).update(
        {"is_active": new_active_status}, synchronize_session=False
    )
    
    db.commit()
    return {"slug": slug, "is_active": new_active_status}


@router.put("/recipe/{slug}/tags")
def add_tags(
    slug: str,
    tag_names: TagsUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Optimized: Load recipe with tags in single query
    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.tags))
        .filter(Recipe.slug == slug)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

    # Batch tag creation for better performance
    existing_tag_names = {tag.name for tag in recipe.tags}
    new_tags = []
    
    for name in tag_names.tags:
        if name not in existing_tag_names:
            # Check if tag exists, create if not
            tag = db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
                db.flush()  # Get tag ID
            
            recipe.tags.append(tag)

    db.commit()
    
    # Return updated tags (no need to refresh)
    return {"slug": slug, "tags": [t.name for t in recipe.tags]}


@router.get("/user/active-recipe")
def get_active_recipe(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get the currently active recipe for the user"""
    try:
        # Optimized: Single query with all related data using selectinload
        active_recipe = (
            db.query(Recipe)
            .options(
                selectinload(Recipe.tags),
                selectinload(Recipe.ingredient_list),
                selectinload(Recipe.instruction_list)
            )
            .filter(Recipe.user_id == current_user.id, Recipe.is_active == True)
            .first()
        )

        if not active_recipe:
            return {"active_recipe": None}

        return {
            "active_recipe": {
                "id": active_recipe.id,
                "title": active_recipe.title,
                "slug": active_recipe.slug,
                "description": active_recipe.description,
                "image": active_recipe.image,
                "ingredients": [i.ingredient for i in active_recipe.ingredient_list],
                "instructions": [step.description for step in active_recipe.instruction_list],
                "prep_time": active_recipe.prep_time,
                "cook_time": active_recipe.cook_time,
                "total_time": active_recipe.total_time,
                "tags": [tag.name for tag in active_recipe.tags],
            }
        }
    except Exception as e:
        print("Error fetching active recipe: ", e)
        return JSONResponse(status_code=500, content={"detail": "Server error"})


# User Tag Management Endpoints
DEFAULT_TAGS = ["cheap", "fast", "vegetarian", "gluten-free", "easy", "healthy"]


@router.get("/user/tags")
def get_user_tags(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all available tags for the user (default + custom)"""
    try:
        # Optimized: Single query to get all user tags
        user_tags = db.query(UserTag).filter(UserTag.user_id == current_user.id).all()

        # Create a set of existing tag names to avoid duplicates
        existing_tags = {tag.tag_name for tag in user_tags}

        # Add default tags that the user doesn't have yet (batch operation)
        new_default_tags = []
        for default_tag in DEFAULT_TAGS:
            if default_tag not in existing_tags:
                new_default_tags.append(
                    UserTag(user_id=current_user.id, tag_name=default_tag, is_default=True)
                )
        
        if new_default_tags:
            db.add_all(new_default_tags)
            db.commit()
            # Refresh the list to include new tags
            user_tags = db.query(UserTag).filter(UserTag.user_id == current_user.id).all()

        return {
            "tags": [
                {"tag_name": tag.tag_name, "is_default": tag.is_default}
                for tag in user_tags
            ]
        }
    except Exception as e:
        print("Error fetching user tags:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch user tags")


@router.post("/user/tags")
def add_user_tag(
    tag_data: UserTagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a custom tag to the user's available tags"""
    try:
        # Check if tag already exists for this user
        existing_tag = (
            db.query(UserTag)
            .filter(
                UserTag.user_id == current_user.id,
                UserTag.tag_name == tag_data.tag_name,
            )
            .first()
        )

        if existing_tag:
            raise HTTPException(status_code=400, detail=TAG_ALREADY_EXISTS)

        # Create new custom tag
        new_tag = UserTag(
            user_id=current_user.id, tag_name=tag_data.tag_name, is_default=False
        )

        db.add(new_tag)
        db.commit()
        db.refresh(new_tag)

        return {"tag_name": new_tag.tag_name, "is_default": new_tag.is_default}
    except HTTPException:
        raise
    except Exception as e:
        print("Error adding user tag:", str(e))
        raise HTTPException(status_code=500, detail="Failed to add user tag")


@router.delete("/user/tags/{tag_name}")
def remove_user_tag(
    tag_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a custom tag from the user's available tags"""
    try:
        # Find the tag
        user_tag = (
            db.query(UserTag)
            .filter(UserTag.user_id == current_user.id, UserTag.tag_name == tag_name)
            .first()
        )

        if not user_tag:
            raise HTTPException(status_code=404, detail=TAG_NOT_FOUND)

        # Don't allow deletion of default tags
        if user_tag.is_default:
            raise HTTPException(status_code=400, detail=CANNOT_DELETE_DEFAULT_TAGS)

        db.delete(user_tag)
        db.commit()

        return {"message": "Tag removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error removing user tag:", str(e))
        raise HTTPException(status_code=500, detail="Failed to remove user tag")


# Recipe Notes Endpoints
class RecipeNoteCreate(BaseModel):
    note: Optional[str] = None


class RecipeNoteUpdate(BaseModel):
    note: Optional[str] = None


@router.get("/recipes/{slug}/note")
def get_recipe_note(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's note for a specific recipe"""
    try:
        recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
        if not recipe:
            raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

        note = (
            db.query(RecipeNote)
            .filter(RecipeNote.recipe_id == recipe.id, RecipeNote.user_id == current_user.id)
            .first()
        )

        if note:
            return {
                "id": note.id,
                "note": note.note,
                "created_at": note.created_at.isoformat() if note.created_at else None,
                "updated_at": note.updated_at.isoformat() if note.updated_at else None,
            }
        else:
            return {"id": None, "note": None, "created_at": None, "updated_at": None}
    except HTTPException:
        raise
    except Exception as e:
        print("Error fetching recipe note:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch recipe note")


@router.post("/recipes/{slug}/note")
def create_recipe_note(
    slug: str,
    note_data: RecipeNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update user's note for a specific recipe"""
    try:
        recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
        if not recipe:
            raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

        # Check if note already exists
        existing_note = (
            db.query(RecipeNote)
            .filter(RecipeNote.recipe_id == recipe.id, RecipeNote.user_id == current_user.id)
            .first()
        )

        if existing_note:
            # Update existing note
            existing_note.note = note_data.note
            existing_note.updated_at = func.now()
            db.commit()
            db.refresh(existing_note)
            return {
                "id": existing_note.id,
                "note": existing_note.note,
                "created_at": existing_note.created_at.isoformat() if existing_note.created_at else None,
                "updated_at": existing_note.updated_at.isoformat() if existing_note.updated_at else None,
            }
        else:
            # Create new note
            new_note = RecipeNote(
                user_id=current_user.id,
                recipe_id=recipe.id,
                note=note_data.note,
            )
            db.add(new_note)
            db.commit()
            db.refresh(new_note)
            return {
                "id": new_note.id,
                "note": new_note.note,
                "created_at": new_note.created_at.isoformat() if new_note.created_at else None,
                "updated_at": new_note.updated_at.isoformat() if new_note.updated_at else None,
            }
    except HTTPException:
        raise
    except Exception as e:
        print("Error creating/updating recipe note:", str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create/update recipe note")


@router.put("/recipes/{slug}/note")
def update_recipe_note(
    slug: str,
    note_data: RecipeNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's note for a specific recipe"""
    try:
        recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
        if not recipe:
            raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

        note = (
            db.query(RecipeNote)
            .filter(RecipeNote.recipe_id == recipe.id, RecipeNote.user_id == current_user.id)
            .first()
        )

        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        note.note = note_data.note
        note.updated_at = func.now()
        db.commit()
        db.refresh(note)

        return {
            "id": note.id,
            "note": note.note,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("Error updating recipe note:", str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update recipe note")


@router.delete("/recipes/{slug}/note", status_code=204)
def delete_recipe_note(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete user's note for a specific recipe"""
    try:
        recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
        if not recipe:
            raise HTTPException(status_code=404, detail=RECIPE_NOT_FOUND)

        note = (
            db.query(RecipeNote)
            .filter(RecipeNote.recipe_id == recipe.id, RecipeNote.user_id == current_user.id)
            .first()
        )

        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        db.delete(note)
        db.commit()

        return None
    except HTTPException:
        raise
    except Exception as e:
        print("Error deleting recipe note:", str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete recipe note")
