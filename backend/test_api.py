import requests
import json

# Base URL for the FastAPI server
BASE_URL = "http://localhost:8000"

def test_user_creation():
    """Test creating a new user"""
    print("Testing user creation...")
    
    user_data = {
        "firstname": "John",
        "lastname": "Doe",
        "email": "john.doe@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/users/create", json=user_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_user_login():
    """Test user login"""
    print("\nTesting user login...")
    
    login_data = {
        "email": "john.doe@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/users/login", json=login_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_recipe_scraping(user_id):
    """Test scraping and saving a recipe"""
    print(f"\nTesting recipe scraping for user {user_id}...")
    
    # Test with a recipe URL (you can change this to any recipe URL)
    recipe_data = {
        "url": "https://www.indianhealthyrecipes.com/chicken-tikka-masala/",
        "user_id": user_id
    }
    
    response = requests.post(f"{BASE_URL}/RecipePage", json=recipe_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Recipe saved successfully!")
        print(f"Recipe ID: {result['recipe']['id']}")
        print(f"Recipe Title: {result['recipe']['title']}")
        print(f"Number of ingredients: {len(result['recipe']['ingredients'])}")
        print(f"Number of instructions: {len(result['recipe']['instructions'])}")
        return result
    else:
        print(f"Error: {response.json()}")
        return None

def test_get_user_recipes(user_id):
    """Test getting all recipes for a user"""
    print(f"\nTesting get user recipes for user {user_id}...")
    
    response = requests.get(f"{BASE_URL}/users/{user_id}/recipes")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Found {len(result['recipes'])} recipes")
        for recipe in result['recipes']:
            print(f"- {recipe['title']} (ID: {recipe['id']})")
            print(f"  Ingredients: {len(recipe['ingredients'])}")
            print(f"  Instructions: {len(recipe['instructions'])}")
        return result
    else:
        print(f"Error: {response.json()}")
        return None

if __name__ == "__main__":
    print("Starting FastAPI tests...")
    
    # Test user creation
    user_result = test_user_creation()
    if user_result and 'user' in user_result:
        user_id = user_result['user']['id']
        
        # Test user login
        test_user_login()
        
        # Test recipe scraping
        recipe_result = test_recipe_scraping(user_id)
        
        # Test getting user recipes
        test_get_user_recipes(user_id)
    else:
        print("User creation failed, skipping other tests") 