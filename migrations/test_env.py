import os
import sys
from dotenv import load_dotenv

# Adjust path to your .env
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'database', '.env'))
load_dotenv(dotenv_path=env_path)

# Now import your config after loading .env
from backend.database.config import DATABASE_URL

print("Loaded DATABASE_URL:", DATABASE_URL)