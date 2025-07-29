import requests
from extruct.jsonld import JsonLdExtractor
import pprint
import json

pp = pprint.PrettyPrinter( indent = 1)


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
}

def extract_webpage_data(url):
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        jslde = JsonLdExtractor()
        data = jslde.extract(response.text)
        
        # Find the recipe object (usually type "Recipe")
        recipe = None

        for item in data:
            # If the item has an @graph, search inside it, not all JSON-LD formatted the same
            if '@graph' in item:
                for subitem in item['@graph']:
                    if '@type' in subitem and (
                        subitem['@type'] == 'Recipe' or
                        (isinstance(subitem['@type'], list) and 'Recipe' in subitem['@type'])
                    ):
                        recipe = subitem
                        break
                if recipe:
                    break
            # Otherwise, check the item itself
            elif '@type' in item and (
                item['@type'] == 'Recipe' or
                (isinstance(item['@type'], list) and 'Recipe' in item['@type'])
            ):
                recipe = item
                break

        if recipe:
            if 'recipeInstructions' in recipe:
                print("\nRecipe Instructions:")
                for instruction in recipe['recipeInstructions']:
                    # Handle HowToSection (with steps)
                    if isinstance(instruction, dict) and instruction.get('@type') == 'HowToSection':
                    
                        section_name = instruction.get('name', 'Section')
                        print(f"\n{section_name}:")
                        for step in instruction.get('itemListElement', []):
                            if isinstance(step, dict):
                                
                                print(f"  - {step.get('text', step.get('name', str(step)))}")
                            else:
                                
                                print(f"  - {step}")
                    # Handle direct HowToStep
                    elif isinstance(instruction, dict) and instruction.get('@type') == 'HowToStep':
                        
                        print(f"- {instruction.get('text', instruction.get('name', str(instruction)))}")
                    # Handle string steps (rare)
                    elif isinstance(instruction, str):
                    
                        print(f"- {instruction}")
                    else:
                        
                        print(f"- {instruction}")
                
            if 'recipeIngredient' in recipe:
                print(f"Ingredients: ")
                for ingredient in recipe['recipeIngredient']:
                    print(f"    -{ingredient}")
            return recipe
        else:
            return "No HowToSteps found."

    else:
        return "Failed to retrieve data. Status code: {response.status_code}"