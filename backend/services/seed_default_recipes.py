"""Seed 10 default recipes for new users."""
import re

from sqlalchemy.orm import Session

from backend.database.db_models import Ingredient, Instruction, Recipe


DEFAULT_RECIPES = [
    {
        "title": "Classic Pancakes",
        "description": "Fluffy buttermilk pancakes perfect for breakfast. Quick to make and endlessly customizable.",
        "ingredients": [
            "1 1/2 cups all-purpose flour",
            "3 1/2 tsp baking powder",
            "1 tsp salt",
            "1 tbsp sugar",
            "1 1/4 cups milk",
            "1 egg",
            "3 tbsp butter, melted",
        ],
        "instructions": [
            "Mix flour, baking powder, salt, and sugar in a bowl.",
            "Make a well in the center and pour in milk, egg, and melted butter. Mix until smooth.",
            "Heat a lightly oiled griddle over medium heat. Pour 1/4 cup batter per pancake.",
            "Cook until bubbles form and edges are dry. Flip and cook until golden.",
        ],
        "prep_time": "10 min",
        "cook_time": "15 min",
        "total_time": "25 min",
        "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    },
    {
        "title": "Spaghetti Aglio e Olio",
        "description": "Simple Italian pasta with garlic, olive oil, and chili flakes. Elegant in its simplicity.",
        "ingredients": [
            "400g spaghetti",
            "6 cloves garlic, thinly sliced",
            "1/2 cup olive oil",
            "1/2 tsp red chili flakes",
            "Salt and black pepper to taste",
            "Fresh parsley, chopped",
            "Parmesan cheese (optional)",
        ],
        "instructions": [
            "Cook spaghetti in salted boiling water until al dente. Reserve 1/2 cup pasta water.",
            "Heat olive oil in a large pan over medium-low. Add garlic and chili flakes. Cook until garlic is golden, about 2 minutes.",
            "Add drained pasta and toss. Add pasta water if needed. Season with salt and pepper.",
            "Serve with parsley and Parmesan.",
        ],
        "prep_time": "5 min",
        "cook_time": "15 min",
        "total_time": "20 min",
        "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80",
    },
    {
        "title": "Greek Salad",
        "description": "Fresh Mediterranean salad with tomatoes, cucumber, olives, and feta. Light and refreshing.",
        "ingredients": [
            "4 large tomatoes, chopped",
            "1 cucumber, sliced",
            "1 red onion, thinly sliced",
            "1 cup Kalamata olives",
            "200g feta cheese, cubed",
            "2 tbsp olive oil",
            "1 tbsp red wine vinegar",
            "1 tsp dried oregano",
            "Salt and pepper to taste",
        ],
        "instructions": [
            "Combine tomatoes, cucumber, and onion in a large bowl.",
            "Add olives and feta. Drizzle with olive oil and vinegar.",
            "Sprinkle oregano, salt, and pepper. Toss gently and serve.",
        ],
        "prep_time": "15 min",
        "cook_time": "0 min",
        "total_time": "15 min",
        "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    },
    {
        "title": "Chicken Stir Fry",
        "description": "Quick and colorful chicken stir fry with vegetables. Serve over rice for a complete meal.",
        "ingredients": [
            "2 chicken breasts, sliced",
            "2 cups mixed vegetables (bell peppers, broccoli, snap peas)",
            "2 tbsp soy sauce",
            "1 tbsp oyster sauce",
            "1 tsp sesame oil",
            "2 cloves garlic, minced",
            "1 inch ginger, minced",
            "2 tbsp vegetable oil",
        ],
        "instructions": [
            "Heat vegetable oil in a wok over high heat. Add chicken and stir fry until cooked through. Set aside.",
            "Add garlic and ginger. Stir fry 30 seconds. Add vegetables and stir fry 3–4 minutes.",
            "Return chicken to wok. Add soy sauce, oyster sauce, and sesame oil. Toss and serve.",
        ],
        "prep_time": "15 min",
        "cook_time": "10 min",
        "total_time": "25 min",
        "image": "https://images.unsplash.com/photo-1565958011703-44f9829ba37a?w=800&q=80",
    },
    {
        "title": "Chocolate Chip Cookies",
        "description": "Classic chewy chocolate chip cookies. Crispy edges, soft centers.",
        "ingredients": [
            "2 1/4 cups all-purpose flour",
            "1 tsp baking soda",
            "1 tsp salt",
            "1 cup butter, softened",
            "3/4 cup granulated sugar",
            "3/4 cup brown sugar",
            "2 eggs",
            "2 tsp vanilla extract",
            "2 cups chocolate chips",
        ],
        "instructions": [
            "Preheat oven to 375°F. Mix flour, baking soda, and salt in a bowl.",
            "Beat butter and both sugars until creamy. Beat in eggs and vanilla.",
            "Gradually blend in flour mixture. Stir in chocolate chips.",
            "Drop rounded tablespoons onto ungreased sheets. Bake 9–11 minutes until golden.",
        ],
        "prep_time": "15 min",
        "cook_time": "10 min",
        "total_time": "25 min",
        "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
    },
    {
        "title": "Veggie Omelette",
        "description": "Fluffy omelette loaded with vegetables. A nutritious start to the day.",
        "ingredients": [
            "3 eggs",
            "2 tbsp milk",
            "1/4 cup bell peppers, diced",
            "1/4 cup spinach, chopped",
            "2 tbsp cheese, shredded",
            "Salt and pepper to taste",
            "1 tbsp butter",
        ],
        "instructions": [
            "Whisk eggs, milk, salt, and pepper in a bowl.",
            "Melt butter in a nonstick pan over medium heat. Pour in egg mixture.",
            "When edges set, add vegetables and cheese to one half. Fold and cook 1 minute.",
        ],
        "prep_time": "5 min",
        "cook_time": "5 min",
        "total_time": "10 min",
        "image": "https://images.unsplash.com/photo-1525351482162-e6c4c4a4a4a4?w=800&q=80",
    },
    {
        "title": "Tomato Basil Soup",
        "description": "Creamy tomato soup with fresh basil. Comfort in a bowl.",
        "ingredients": [
            "2 tbsp olive oil",
            "1 onion, diced",
            "3 cloves garlic, minced",
            "2 cans (28 oz) crushed tomatoes",
            "1 cup vegetable broth",
            "1/2 cup fresh basil, chopped",
            "1/2 cup heavy cream",
            "Salt and pepper to taste",
        ],
        "instructions": [
            "Heat oil in a pot. Sauté onion until soft. Add garlic and cook 1 minute.",
            "Add tomatoes and broth. Simmer 15 minutes. Add basil.",
            "Blend until smooth. Stir in cream. Season and serve.",
        ],
        "prep_time": "10 min",
        "cook_time": "25 min",
        "total_time": "35 min",
        "image": "https://images.unsplash.com/photo-1547592168-9140c8d8c8d8?w=800&q=80",
    },
    {
        "title": "Guacamole",
        "description": "Creamy avocado dip with lime and cilantro. Perfect with tortilla chips.",
        "ingredients": [
            "3 ripe avocados",
            "1 lime, juiced",
            "1/2 red onion, diced",
            "1 tomato, diced",
            "2 tbsp cilantro, chopped",
            "1 jalapeño, minced (optional)",
            "Salt to taste",
        ],
        "instructions": [
            "Mash avocados in a bowl. Add lime juice and salt.",
            "Fold in onion, tomato, cilantro, and jalapeño.",
            "Taste and adjust seasoning. Serve with chips.",
        ],
        "prep_time": "10 min",
        "cook_time": "0 min",
        "total_time": "10 min",
        "image": "https://images.unsplash.com/photo-1523049673857-eb92f8f8f8f8?w=800&q=80",
    },
    {
        "title": "Grilled Cheese Sandwich",
        "description": "Crispy, melty grilled cheese. Simple and satisfying.",
        "ingredients": [
            "4 slices bread",
            "4 slices cheddar cheese",
            "2 tbsp butter",
        ],
        "instructions": [
            "Butter one side of each bread slice.",
            "Place cheese between bread, buttered sides out.",
            "Cook in a skillet over medium heat until golden on each side, 2–3 minutes per side.",
        ],
        "prep_time": "2 min",
        "cook_time": "6 min",
        "total_time": "8 min",
        "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80",
    },
    {
        "title": "Banana Smoothie",
        "description": "Creamy banana smoothie. Add protein powder or peanut butter for extra fuel.",
        "ingredients": [
            "2 ripe bananas",
            "1 cup milk",
            "1/2 cup yogurt",
            "1 tbsp honey",
            "1/2 tsp vanilla extract",
            "Handful of ice",
        ],
        "instructions": [
            "Add all ingredients to a blender.",
            "Blend until smooth. Add more milk if too thick.",
            "Pour into a glass and serve immediately.",
        ],
        "prep_time": "5 min",
        "cook_time": "0 min",
        "total_time": "5 min",
        "image": "https://images.unsplash.com/photo-1505252585461-04db1eb2f8d1?w=800&q=80",
    },
]


def _slugify(title: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")


def _generate_unique_slug(db: Session, base_slug: str) -> str:
    slug = base_slug
    count = 1
    while db.query(Recipe).filter(Recipe.slug == slug).first() is not None:
        slug = f"{base_slug}-{count}"
        count += 1
    return slug


def seed_default_recipes(db: Session, user_id: int) -> None:
    """Insert 10 default recipes for a new user."""
    for data in DEFAULT_RECIPES:
        base_slug = _slugify(data["title"])
        slug = _generate_unique_slug(db, base_slug)

        recipe = Recipe(
            title=data["title"],
            slug=slug,
            user_id=user_id,
            description=data["description"],
            image=data.get("image", ""),
            favorite=False,
            is_active=False,
            prep_time=data.get("prep_time"),
            cook_time=data.get("cook_time"),
            total_time=data.get("total_time"),
        )
        db.add(recipe)
        db.flush()

        for i, ing in enumerate(data["ingredients"]):
            db.add(Ingredient(ingredient=ing, recipe_id=recipe.id))

        for i, step in enumerate(data["instructions"]):
            db.add(Instruction(description=step, recipe_id=recipe.id, step_number=i + 1))

    db.commit()
