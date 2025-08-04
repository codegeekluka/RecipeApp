from email.policy import HTTP
from hashlib import algorithms_guaranteed
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from backend.database.db_models import User
from backend.database.database import engine, get_db, SessionLocal
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from pathlib import Path

# Get the path to the .env file explicitly
env_path = Path(__file__).resolve().parent.parent / "database" / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()
JWT_PASSWORD = os.getenv("JWT_PASSWORD", "password")

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") #this is where we are able to identify where the JWT is in our code 

#Creating password context, way for us to hash our passwords in the future
pass_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Creating a secret key for our JWT
SECRET_KEY = JWT_PASSWORD
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserCreate(BaseModel):
    username: str
    password: str

#check if they exist in the database, query User table and filter username column where the exists the type username
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()
#allow user to create new user based on create_user call
def create_user(db:Session, user: UserCreate):
    #user.password accesses the pydantic model field UserCraete
    hashed_password = pass_context.hash(user.password) #hashing the password entered
    db_user = User(username=user.username, hashed_password =hashed_password) #adding new user
    db.add(db_user)
    db.commit()
    return "complete"

#to be able to call this we need a api endpoint, SEE auth notes in OneNote
@router.post("/register")
def register_user(user: UserCreate, db: Session =Depends(get_db)):
    #user.username is accessing "user" from the user:UserCreate instance, db is being positionally passed
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

#Authenticate the user
def authenticate_user(username: str, password: str, db:Session):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False #username doesn't match in database
    if not pass_context.verify(password, user.hashed_password):
        return False
    return user

#data should be a dictionary, expiry should be time
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    #creating the payload part of the token
    to_encode = data.copy() 
    if expires_delta:
        expire = datetime.now(timezone.utc) +expires_delta
    else:
        expire= datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire}) #dict1 = {'a': 1, 'b': 2} dict2 = {'b': 3, 'c': 4} dict1.update(dict2)  Output: {'a': 1, 'b': 3, 'c': 4}
    #encoding the payload and algorithm using the SECRET KEY
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#creating a new post for our token
@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm =Depends(), db: Session = Depends(get_db)):
    user=authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code =status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token=create_access_token(
        data={"sub":user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def verify_token(token: str= Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid or expired")
        return payload
    except JWTError:
        raise HTTPException(status_code =403, detail="Token is invalid or expired")

@router.post("/verify-token")
def verify_user_token(token: str = Depends(oauth2_scheme)):
    verify_token(token=token)
    return {"message": "Token is valid"}