from sqlalchemy import ForeignKey, Column, String, Integer, Text, Boolean, Table
from sqlalchemy.orm import relationship
from backend.database.database import Base


class BaseModel(Base):
    __abstract__ =True
    __allow_unmapped__ = True
    id = Column("id", Integer, primary_key = True , autoincrement= True)

#Association table
recipe_tags = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", ForeignKey("recipe.id"), primary_key=True),
    Column("tag_id", ForeignKey("tag.id"), primary_key=True)
)

#Tag model
class Tag(Base):
    __tablename__ = "tag"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    recipes = relationship(
        "Recipe",
        secondary=recipe_tags,
        back_populates="tags"
    )


class Recipe(BaseModel):
    __tablename__ = "recipe"

    title = Column("title", String, index=True) #index speeds up recipe queries that filter by title
    slug = Column(String, unique=True, index=True)
    user_id = Column(ForeignKey("user.id"))
    description = Column("description", Text, nullable=True)
    image = Column("image", String)
    favorite = Column("favorite", Boolean, default=False)
    is_active = Column("is_active",Boolean, default=False)
    

    # Relationships with cascade delete for data integrity
    instruction_list = relationship("Instruction", back_populates="recipe", cascade="all, delete-orphan")
    ingredient_list = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")

    #I choose not to include recipe_id because i dont want to interfere w postgreSQL automatic adding
    def __init__(self, title, slug, description, image, favorite, tags,active, user_id=None):
        self.title = title
        self.slug = slug
        self.user_id = user_id
        self.description = description
        self.image = image
        self.favorite = favorite
        self.is_active = active
        self.tags= tags
    
    def to_dict(self):
        return {
            "title": self.title,
            "slug":self.slug,
            "id": self.id,
            "description": self.description,
            "image": self.image,
            "is_favorite": self.favorite,
            "is_active": self.is_active,
            "tags": self.tags
        }
        
    
    def __repr__ (self):
        return f"{self.id}\n{self.title} for {self.user_id}"


class User(BaseModel):
    __tablename__ = "user"

    username = Column("username", String, index=True)
    hashed_password = Column(String) #using bycrypt algorithm to hash
    firstname = Column("first_name", String)
    lastname = Column("last_name", String)
    email = Column("email", String, unique=True)
    recipes = relationship(Recipe, cascade="all, delete-orphan")

    def __repr__ (self): #how we want to represent the data/print it
        return f"Hello {self.firstname} {self.lastname}, here are your details:\nemail: {self.email}\nid:{self.id}"


class Instruction(BaseModel):
    __tablename__ = "instruction"

    description = Column("description", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="instruction_list")

    def __init__(self, description, recipe_id):
        self.description = description
        self.recipe_id = recipe_id
    
    def __repr__(self):
        return f"{self.description} belongs to {self.recipe_id}"


class Ingredient(BaseModel):
    __tablename__ = "ingredient"

    ingredient = Column("ingredient", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="ingredient_list")

    def __init__(self, ingredient, recipe_id):
        self.ingredient = ingredient
        self.recipe_id = recipe_id
        
    
    def __repr__(self):
        return f"{self.ingredient} belongs to {self.recipe_id}"


#Base.metadata.create_all(bind=engine) takes all classes that extends from base and creates them in the database, used for prototyping, ill uses alembic




'''without _init_ need to use keyword arguments ie firstname=...

session.add(User(firstname="Alisha", lastname="keys", email="alisha.keys@gmail.com"))
results = session.query(User).all()
for r in results:
   print(r)

owner of the recipe must be equal to the id of the user
and this person that owns this thing has to have the name Anna
user = session.query(User).filter_by(id=2).one_or_none()
session.delete(user)

user3 = User(firstname="joe", lastname="rogan", email="joerogan@email.com")
session.add(user3)
session.commit()

NEED delete account function, add recipe function etc'''