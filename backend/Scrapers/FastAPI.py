from fastapi import FastAPI, HTTPException, Depends
from fastapi.routing import JSONResponse
from pydantic import BaseModel
from Scrapers.scraper import extract_webpage_data
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os

# Add the database directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'database'))

from database.crud import (
    create_user, get_user_by_id, get_user_by_email,
    create_recipe, get_recipes_by_user, get_recipe_by_id_and_user,
    create_ingredient, get_all_ingredients_by_recipe_and_user,
    create_instruction, get_all_instructions_by_recipe_and_user
)
from database.db_models import Session

app = FastAPI()

class RecipeRequest(BaseModel):
    url: str
    user_id: int

class UserCreateRequest(BaseModel):
    firstname: str
    lastname: str
    email: str

class UserLoginRequest(BaseModel):
    email: str

# Database dependency
def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

@app.post('/RecipePage')
def parse_recipe(req: RecipeRequest, db: Session = Depends(get_db)):
    try:
        # First verify the user exists
        user = get_user_by_id(db, req.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Scrape the recipe data
        recipe_data = extract_webpage_data(req.url)
        if recipe_data == 'No HowToSteps found.' or recipe_data == "Failed to retrieve data.":
            raise HTTPException(status_code=400, detail="Could not scrape website")
        
        # Extract recipe title
        recipe_title = recipe_data.get('name', 'Untitled Recipe')
        
        # Create the recipe in the database
        recipe = create_recipe(db, recipe_title, req.user_id)
        
        # Process and save ingredients
        ingredients_data = recipe_data.get('recipeIngredient', [])
        saved_ingredients = []
        
        for ingredient_text in ingredients_data:
            if isinstance(ingredient_text, str) and ingredient_text.strip():
                # Simple parsing - you might want to improve this
                # For now, we'll store the full text and let the frontend parse it
                ingredient = create_ingredient(
                    db, 
                    name=ingredient_text.strip(), 
                    quantity="", 
                    unit="", 
                    recipe_id=recipe.id,
                    user_id=req.user_id
                )
                saved_ingredients.append({
                    "id": ingredient.id,
                    "name": ingredient.name,
                    "quantity": ingredient.quantity,
                    "unit": ingredient.unit
                })
        
        # Process and save instructions
        instructions_data = recipe_data.get('recipeInstructions', [])
        saved_instructions = []
        step_number = 1
        
        for instruction in instructions_data:
            instruction_text = ""
            
            # Handle different instruction formats
            if isinstance(instruction, dict):
                if instruction.get('@type') == 'HowToSection':
                    # Handle section with multiple steps
                    for step in instruction.get('itemListElement', []):
                        if isinstance(step, dict):
                            step_text = step.get('text', step.get('name', str(step)))
                        else:
                            step_text = str(step)
                        
                        if step_text.strip():
                            instruction_obj = create_instruction(
                                db,
                                step_number=step_number,
                                description=step_text.strip(),
                                recipe_id=recipe.id,
                                user_id=req.user_id
                            )
                            saved_instructions.append({
                                "id": instruction_obj.id,
                                "step_number": instruction_obj.step_number,
                                "description": instruction_obj.description
                            })
                            step_number += 1
                
                elif instruction.get('@type') == 'HowToStep':
                    # Handle single step
                    instruction_text = instruction.get('text', instruction.get('name', str(instruction)))
                else:
                    instruction_text = str(instruction)
            
            elif isinstance(instruction, str):
                instruction_text = instruction
            
            # Save the instruction if we have text
            if instruction_text.strip():
                instruction_obj = create_instruction(
                    db,
                    step_number=step_number,
                    description=instruction_text.strip(),
                    recipe_id=recipe.id,
                    user_id=req.user_id
                )
                saved_instructions.append({
                    "id": instruction_obj.id,
                    "step_number": instruction_obj.step_number,
                    "description": instruction_obj.description
                })
                step_number += 1
        
        return JSONResponse(content={
            "message": "Recipe saved successfully",
            "recipe": {
                "id": recipe.id,
                "title": recipe.title,
                "ingredients": saved_ingredients,
                "instructions": saved_instructions
            },
            "original_data": recipe_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/users/create')
def create_new_user(req: UserCreateRequest, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, req.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        user = create_user(db, req.firstname, req.lastname, req.email)
        return JSONResponse(content={
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/users/login')
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    try:
        user = get_user_by_email(db, req.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return JSONResponse(content={
            "message": "Login successful",
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/users/{user_id}/recipes')
def get_user_recipes(user_id: int, db: Session = Depends(get_db)):
    try:
        recipes = get_recipes_by_user(db, user_id)
        recipe_list = []
        
        for recipe in recipes:
            # Get ingredients and instructions for each recipe
            ingredients = get_all_ingredients_by_recipe_and_user(db, recipe.id, user_id)
            instructions = get_all_instructions_by_recipe_and_user(db, recipe.id, user_id)
            
            recipe_list.append({
                "id": recipe.id,
                "title": recipe.title,
                "ingredients": [
                    {
                        "id": ing.id,
                        "name": ing.name,
                        "quantity": ing.quantity,
                        "unit": ing.unit
                    } for ing in ingredients
                ],
                "instructions": [
                    {
                        "id": inst.id,
                        "step_number": inst.step_number,
                        "description": inst.description
                    } for inst in instructions
                ]
            })
        
        return JSONResponse(content={
            "recipes": recipe_list
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.add_middleware(
    CORSMiddleware,
    #allow requsts from our frontend
    allow_origins=["http://localhost:5173"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)