from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.database.database import Base


class BaseModel(Base):
    __abstract__ = True
    __allow_unmapped__ = True
    id = Column("id", Integer, primary_key=True, autoincrement=True)


# Association table
recipe_tags = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", ForeignKey("recipe.id"), primary_key=True),
    Column("tag_id", ForeignKey("tag.id"), primary_key=True),
)


# Tag model
class Tag(Base):
    __tablename__ = "tag"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_tags, back_populates="tags")


class Recipe(BaseModel):
    __tablename__ = "recipe"

    title = Column(
        "title", String, index=True
    )  # index speeds up recipe queries that filter by title
    slug = Column(String, unique=True, index=True)
    user_id = Column(ForeignKey("user.id"))
    description = Column("description", Text, nullable=True)
    image = Column("image", String)
    favorite = Column("favorite", Boolean, default=False)
    is_active = Column("is_active", Boolean, default=False)

    # Cooking times (human readable strings)
    prep_time = Column("prep_time", String, nullable=True)
    cook_time = Column("cook_time", String, nullable=True)
    total_time = Column("total_time", String, nullable=True)

    # Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
    embedding = Column("embedding", Vector(1536), nullable=True)

    # Relationships with cascade delete for data integrity
    instruction_list = relationship(
        "Instruction", back_populates="recipe", cascade="all, delete-orphan"
    )
    ingredient_list = relationship(
        "Ingredient", back_populates="recipe", cascade="all, delete-orphan"
    )
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")
    sessions = relationship(
        "UserSession", back_populates="recipe", cascade="all, delete-orphan"
    )
    notes = relationship(
        "RecipeNote", back_populates="recipe", cascade="all, delete-orphan"
    )

    # SQLAlchemy handles object creation automatically

    def to_dict(self):
        return {
            "title": self.title,
            "slug": self.slug,
            "id": self.id,
            "description": self.description,
            "image": self.image,
            "favorite": self.favorite,
            "is_active": self.is_active,
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "total_time": self.total_time,
            "tags": self.tags,
        }

    def __repr__(self):
        return f"{self.id}\n{self.title} for {self.user_id}"


class User(BaseModel):
    __tablename__ = "user"

    username = Column("username", String, index=True)
    hashed_password = Column(String)  # using bycrypt algorithm to hash
    firstname = Column("first_name", String)
    lastname = Column("last_name", String)
    email = Column("email", String, unique=True)
    age = Column("age", Integer, nullable=True)
    profile_picture_url = Column("profile_picture_url", String, nullable=True)
    hero_image_url = Column("hero_image_url", String, nullable=True)
    onboarding_complete = Column("onboarding_complete", Boolean, default=False)
    how_heard_about = Column("how_heard_about", String, nullable=True)
    theme_preference = Column("theme_preference", String, default="system")  # light, dark, system
    recipes = relationship(Recipe, cascade="all, delete-orphan")
    sessions = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    user_tags = relationship("UserTag", cascade="all, delete-orphan")
    dietary_restrictions = relationship(
        "UserDietaryRestriction", cascade="all, delete-orphan"
    )
    cuisine_preferences = relationship(
        "UserCuisinePreference", cascade="all, delete-orphan"
    )
    health_goals = relationship("UserHealthGoal", cascade="all, delete-orphan")
    budget_preferences = relationship(
        "UserBudgetPreference", cascade="all, delete-orphan"
    )
    skill_level_rel = relationship(
        "UserSkillLevel", uselist=False, cascade="all, delete-orphan"
    )
    recipe_notes = relationship("RecipeNote", cascade="all, delete-orphan")
    subscription = relationship(
        "UserSubscription", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self):  # how we want to represent the data/print it
        return f"Hello {self.firstname} {self.lastname}, here are your details:\nemail: {self.email}\nid:{self.id}"


class UserTag(BaseModel):
    __tablename__ = "user_tag"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    tag_name = Column("tag_name", String, nullable=False)
    is_default = Column(
        "is_default", Boolean, default=False
    )  # Whether this is a default tag
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )

    # Relationship back to User
    user = relationship("User", back_populates="user_tags")

    def __repr__(self):
        return f"Tag '{self.tag_name}' for user {self.user_id}"


class Instruction(BaseModel):
    __tablename__ = "instruction"

    description = Column("description", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))
    step_number = Column("step_number", Integer, nullable=True)  # For ordering steps

    # Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
    embedding = Column("embedding", Vector(1536), nullable=True)

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="instruction_list")

    # SQLAlchemy handles object creation automatically

    def __repr__(self):
        return f"{self.description} belongs to {self.recipe_id}"


class Ingredient(BaseModel):
    __tablename__ = "ingredient"

    ingredient = Column("ingredient", String)
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))

    # Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
    embedding = Column("embedding", Vector(1536), nullable=True)

    # Relationship back to Recipe
    recipe = relationship("Recipe", back_populates="ingredient_list")

    # SQLAlchemy handles object creation automatically

    def __repr__(self):
        return f"{self.ingredient} belongs to {self.recipe_id}"


class UserSession(BaseModel):
    __tablename__ = "user_session"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))
    session_id = Column(
        "session_id", String, unique=True, index=True
    )  # UUID for session tracking
    current_step = Column("current_step", Integer, default=1)  # Current cooking step
    is_active = Column("is_active", Boolean, default=True)  # Session status
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )
    updated_at = Column("updated_at", DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="sessions")
    recipe = relationship("Recipe", back_populates="sessions")
    conversations = relationship(
        "UserConversation", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"Session {self.session_id} for user {self.user_id} cooking recipe {self.recipe_id}"


class UserConversation(BaseModel):
    __tablename__ = "user_conversation"

    session_id = Column(ForeignKey("user_session.session_id", ondelete="CASCADE"))
    role = Column("role", String)  # "user" or "assistant"
    message = Column("message", Text)
    timestamp = Column("timestamp", DateTime(timezone=True), server_default=func.now())

    # Optional fields for analytics
    query_type = Column(
        "query_type", String, nullable=True
    )  # e.g., "ingredient_question", "technique_question"
    response_time_ms = Column(
        "response_time_ms", Integer, nullable=True
    )  # Response time in milliseconds

    # Relationship back to session
    session = relationship("UserSession", back_populates="conversations")

    def __repr__(self):
        return f"{self.role}: {self.message[:50]}... at {self.timestamp}"


class UserDietaryRestriction(BaseModel):
    __tablename__ = "user_dietary_restriction"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    restriction = Column(
        "restriction", String, nullable=False
    )  # e.g., "vegetarian", "gluten-free", "dairy-free"
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )

    # Relationship back to User
    user = relationship("User", back_populates="dietary_restrictions")

    def __repr__(self):
        return f"Dietary restriction '{self.restriction}' for user {self.user_id}"


class UserCuisinePreference(BaseModel):
    __tablename__ = "user_cuisine_preference"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    cuisine = Column(
        "cuisine", String, nullable=False
    )  # e.g., "italian", "mexican", "asian"
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )

    # Relationship back to User
    user = relationship("User", back_populates="cuisine_preferences")

    def __repr__(self):
        return f"Cuisine preference '{self.cuisine}' for user {self.user_id}"


class UserHealthGoal(BaseModel):
    __tablename__ = "user_health_goal"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    goal = Column(
        "goal", String, nullable=False
    )  # e.g., "lose_weight", "gain_weight", "maintain_weight"
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )

    # Relationship back to User
    user = relationship("User", back_populates="health_goals")

    def __repr__(self):
        return f"Health goal '{self.goal}' for user {self.user_id}"


class UserBudgetPreference(BaseModel):
    __tablename__ = "user_budget_preference"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    budget_type = Column(
        "budget_type", String, nullable=False
    )  # e.g., "cheap", "expensive", "something_in_between"
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )

    # Relationship back to User
    user = relationship("User", back_populates="budget_preferences")

    def __repr__(self):
        return f"Budget preference '{self.budget_type}' for user {self.user_id}"


class UserSkillLevel(Base):
    __tablename__ = "user_skill_level"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"), primary_key=True)
    skill_level = Column(
        "skill_level", String, nullable=False
    )  # e.g., "beginner", "intermediate", "advanced"
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )
    updated_at = Column("updated_at", DateTime(timezone=True), onupdate=func.now())

    # Relationship back to User
    user = relationship("User", back_populates="skill_level_rel")

    def __repr__(self):
        return f"Skill level '{self.skill_level}' for user {self.user_id}"


class RecipeNote(BaseModel):
    __tablename__ = "recipe_note"

    user_id = Column(ForeignKey("user.id", ondelete="CASCADE"))
    recipe_id = Column(ForeignKey("recipe.id", ondelete="CASCADE"))
    note = Column("note", Text, nullable=True)
    created_at = Column(
        "created_at", DateTime(timezone=True), server_default=func.now()
    )
    updated_at = Column("updated_at", DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="recipe_notes")
    recipe = relationship("Recipe", back_populates="notes")

    def __repr__(self):
        return f"Note for recipe {self.recipe_id} by user {self.user_id}"


class UserSubscription(BaseModel):
    __tablename__ = "user_subscription"

    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"), unique=True, index=True
    )
    sessions_used = Column("sessions_used", Integer, default=0)
    is_premium = Column("is_premium", Boolean, default=False)
    last_reset_date = Column(
        "last_reset_date", DateTime(timezone=True), server_default=func.now()
    )
    last_used = Column("last_used", DateTime(timezone=True), nullable=True)

    # Relationship back to User
    user = relationship("User", back_populates="subscription")

    def __repr__(self):
        return f"Subscription for user {self.user_id}: {self.sessions_used} sessions used, premium: {self.is_premium}"


# Base.metadata.create_all(bind=engine) takes all classes that extends from base and creates them in the database, used for prototyping, ill uses alembic


"""without _init_ need to use keyword arguments ie firstname=...

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

NEED delete account function, add recipe function etc"""
