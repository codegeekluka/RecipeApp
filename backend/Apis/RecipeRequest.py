from fastapi import  APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from fastapi.responses import JSONResponse
from backend.database.database import get_db
from backend.database.db_models import Recipe, Instruction, Ingredient, User, Tag
from pydantic import BaseModel
from backend.Scrapers.scraper import extract_webpage_data
from backend.Apis.auth import get_current_user
import re
from typing import List, Optional


#creates new router instance
router = APIRouter()

class RecipeRequest(BaseModel):
    url: str
class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    ingredients: Optional[List[str]] = None
    instructions: Optional[List[str]] = None

class TagsUpdate(BaseModel):
    tags: List[str]

def generate_unique_slug(db: Session, title: str) -> str:
    base_slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')
    slug = base_slug
    count = 1

    while db.query(Recipe).filter(Recipe.slug == slug).first() is not None:
        slug = f"{base_slug}-{count}"
        count += 1

    return slug


def extract_instruction_texts(instructions):
    steps = []

    if isinstance(instructions, str):
        return [instructions]

    for item in instructions:
        if isinstance(item, dict):
            item_type = item.get("@type")

            if item_type == "HowToSection":
                section_name = item.get("name")
                if section_name:
                    steps.append(f"## {section_name}")  # Markdown-style header, or just plain text
                section_items = item.get("itemListElement", [])
                steps.extend(extract_instruction_texts(section_items))

            elif item_type == "HowToStep":
                text = item.get("text")
                if text:
                    steps.append(text)

        elif isinstance(item, str):
            steps.append(item)

    return steps

#when defining endpoints, FastAPI app must be ware of these
@router.post('/RecipePage')
def parse_recipe(req: RecipeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        recipe = extract_webpage_data(req.url)
        if recipe == 'No HowToSteps found.' or recipe == "Failed to retrieve data.":
            raise ValueError("Could not scrape website")
        # Create and store recipe
        slug = generate_unique_slug(db,recipe["name"])

        image_data = recipe.get("image", "")
        # If it's a dict (like ImageObject), extract the 'url' key
        if isinstance(image_data, dict):
            image = image_data.get("url", "")
        # If it's a list of images, use the first one
        elif isinstance(image_data, list) and image_data:
            first = image_data[0]
            image = first.get("url", "") if isinstance(first, dict) else first
        # If it's already a string, use it directly
        elif isinstance(image_data, str):
            image = image_data
        else:
            image = ""

        new_recipe = Recipe(
            title=recipe["name"],
            slug=slug,
            user_id=current_user.id,
            description=recipe["description"],
            image=image,
            favorite=False,
            active=False
            )
        db.add(new_recipe)
        db.flush()  # Assigns recipe.id

        # Add instructions (handle string list or object format)
        instructions = recipe.get("recipeInstructions", [])
        step_texts = extract_instruction_texts(instructions)

        for step_text in step_texts:
            db.add(Instruction(description=step_text, recipe_id=new_recipe.id))
        if not step_texts:
            raise ValueError("No valid instructions found in recipeInstructions.")


        # Add ingredients
        for item in recipe.get("recipeIngredient", []):
            db.add(Ingredient(ingredient=item, recipe_id=new_recipe.id))

        db.commit()    
        return {"recipe_id": new_recipe.id, "slug":slug} #return on success
    except Exception as e :
        raise HTTPException(status_code = 400, detail=str(e))

@router.get("/recipes/{slug}")
def get_recipe_by_slug(slug: str, db: Session = Depends(get_db)):
    #joinedload eager loads tags
    recipe = db.query(Recipe).options(joinedload(Recipe.tags)).filter(Recipe.slug == slug).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    ingredients = db.query(Ingredient).filter(Ingredient.recipe_id == recipe.id).all()
    instructions = db.query(Instruction).filter(Instruction.recipe_id == recipe.id).all()

    return {
        "title": recipe.title,
        "slug": recipe.slug,
        "description": recipe.description,
        "image": recipe.image,
        "ingredients": [i.ingredient for i in ingredients],
        "instructions": [step.description for step in instructions],
        "is_favorite": recipe.favorite,
        "is_active": recipe.is_active,
        "tags": [tag.name for tag in recipe.tags]
    }

@router.get("/user/recipes")
def get_user_recipes(current_user: User = Depends(get_current_user), db: Session= Depends(get_db)):
    try: 
        user_recipes= db.query(Recipe).filter(Recipe.user_id == current_user.id).all()
        return {"recipes": [recipe.to_dict() for recipe in user_recipes]}
    except Exception as e:
        print("Error fetching recipes: ", e)
        return JSONResponse(status_code=500, content={"detail": "Server error"})
  

#Updating Recipe information:
@router.put("/recipes/{slug}")
def update_recipe(
    slug: str,
    updated_data: RecipeUpdate,  # Expect title, description, ingredients, instructions
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    db_recipe = db.query(Recipe).filter(Recipe.slug == slug).first()

    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if db_recipe.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this recipe")

     # Update only provided fields
    if updated_data.title is not None:
        db_recipe.title = updated_data.title
    if updated_data.description is not None:
        db_recipe.description = updated_data.description

    if updated_data.ingredients is not None:
        db.query(Ingredient).filter(Ingredient.recipe_id == db_recipe.id).delete()
        for item in updated_data.ingredients:
            db.add(Ingredient(recipe_id=db_recipe.id, ingredient=item))

    if updated_data.instructions is not None:
        db.query(Instruction).filter(Instruction.recipe_id == db_recipe.id).delete()
        for step in updated_data.instructions:
            db.add(Instruction(recipe_id=db_recipe.id, description=step))

    db.commit()
    db.refresh(db_recipe)

    return db_recipe

#delete recipe

@router.delete("/recipes/{slug}", status_code=204)
def delete_recipe(slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_recipe = db.query(Recipe).filter(Recipe.slug == slug).first()

    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if db_recipe.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this recipe")

    # Delete related ingredients and instructions first (if needed)
    db.query(Ingredient).filter(Ingredient.recipe_id == db_recipe.id).delete()
    db.query(Instruction).filter(Instruction.recipe_id == db_recipe.id).delete()

    # Then delete the recipe itself
    db.delete(db_recipe)
    db.commit()

    return {"detail": "Recipe deleted"}

#Add recipe manually:
@router.post("/recipe/manualRecipe")
def create_manual_recipe(
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(recipe_in)
    try:
        # Generate a unique slug
        slug = generate_unique_slug(db, recipe_in.title)

        # Create and store the main recipe
        new_recipe = Recipe(
            title=recipe_in.title,
            slug=slug,
            user_id=current_user.id,
            description=recipe_in.description,
            image=recipe_in.image,
            favorite=False,
            is_active=True

        )
        db.add(new_recipe)
        db.flush()  # Assigns new_recipe.id

        # Add ingredients
        for item in recipe_in.ingredients:
            db.add(Ingredient(ingredient=item, recipe_id=new_recipe.id))

        # Add instructions
        for step_text in recipe_in.instructions:
            db.add(Instruction(description=step_text, recipe_id=new_recipe.id))

        db.commit()

        return {"recipe_id": new_recipe.id, "slug": slug}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create recipe: {str(e)}")


@router.put("/recipe/{slug}/favorite")
def toggle_favorite(slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    print(f"hello")
    recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
    print(recipe)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.favorite = not recipe.favorite
    db.commit()
    db.refresh(recipe)
    return {"slug": slug, "is_favorite": recipe.favorite}

@router.put("/recipe/{slug}/active")
def toggle_active(slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.is_active = not recipe.is_active
    db.commit()
    db.refresh(recipe)
    return {"slug": slug, "is_active": recipe.is_active}


@router.put("/recipe/{slug}/tags")
def add_tags(slug: str, tag_names: TagsUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.slug == slug).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    for name in tag_names.tags:
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()

        if tag not in recipe.tags:
            recipe.tags.append(tag)

    db.commit()
    db.refresh(recipe)
    return {"slug": slug, "tags": [t.name for t in recipe.tags]}

