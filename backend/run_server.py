import uvicorn
import sys
import os

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting FastAPI server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation will be available at: http://localhost:8000/docs")
    
    uvicorn.run(
        "Scrapers.FastAPI:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    ) 