from sqlalchemy import create_engine, ForeignKey, Column, String, Integer, CHAR
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from migrations.config import DATABASE_URL

Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

class BaseModel(Base):
    __abstract__ =True
    __allow_unmapped__ = True
    id = Column("id", Integer, primary_key = True , autoincrement= True)


class Recipe(BaseModel):
    __tablename__ = "recipe"

    title = Column("title", String)
    user_id = Column(ForeignKey("user.id"))

    # Relationships with cascade delete for data integrity
    instruction_list = relationship("Instruction", back_populates="recipe", cascade="all, delete-orphan")
    ingredient_list = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")

    #I choose not to include recipe_id because i dont want to interfere w postgreSQL automatic adding
    def __init__(self, title):
        self.title = title
        
    
    def __repr__ (self):
        return f"{self.id}\n{self.title}"


class User(BaseModel):
    __tablename__ = "user"

    firstname = Column("first_name", String)
    lastname = Column("last_name", String)
    email = Column("email", String)
    recipes = relationship(Recipe, cascade="all, delete-orphan")

    def __repr__ (self): #how we want to represent the data/print it
        return f"Hello {self.firstname} {self.lastname}, here are your details:\nemail: {self.email}\nid:{self.id}"


class Instruction(BaseModel):
    __tablename__ = "instruction"

    step_number = Column("step_number", Integer)
    description = Column("description", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="instruction_list")

    def __init__(self, step_number, description):
        self.step_number = step_number
        self.description = description
    
    def __repr__(self):
        return f"Step {self.step_number}: {self.description}"


class Ingredient(BaseModel):
    __tablename__ = "ingredient"

    name = Column("name", String)
    quantity = Column("quantity", String)
    unit = Column("unit", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="ingredient_list")

    def __init__(self, name, quantity, unit):
        self.name = name
        self.quantity = quantity
        self.unit = unit
    
    def __repr__(self):
        return f"{self.quantity} {self.unit} {self.name}"


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