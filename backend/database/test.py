from crud import create_user, delete_all_user_data, create_recipe, get_recipes_by_user, create_ingredient
from db_models import Session


db = Session()  # Create a new session
'''
new_user = create_user(db, firstname="alex", lastname="monroe", email="alex@example.com")
new_user = create_user(db, firstname="mia", lastname="Dode", email="mia@example.com")
new_user = create_user(db, firstname="joni", lastname="donald", email="joni@example.com")
new_user = create_user(db, firstname="ami", lastname="riverland", email="ami@example.com")


create_recipe(db, "Lasagne",3)
create_recipe(db, "Fettucine",3)
create_recipe(db, "shrimp scampi",4)
create_recipe(db, "Fresh bread",5)
create_recipe(db, "tomato soup",5)
create_recipe(db, "hotdogs",6)
create_recipe(db, "homemade pizza",2)
'''

recipes =  create_ingredient(db,"shrimp", "4", "",5 , 4)
print(recipes)
