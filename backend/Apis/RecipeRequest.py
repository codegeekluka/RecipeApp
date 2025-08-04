from fastapi import  APIRouter, HTTPException
from pydantic import BaseModel
from backend.Scrapers.scraper import extract_webpage_data
from fastapi.responses import JSONResponse

#creates new router instance
router = APIRouter()

class RecipeRequest(BaseModel):
    url: str

#when defining endpoints, FastAPI app must be ware of these
@router.post('/RecipePage')
def parse_recipe(req: RecipeRequest):
    try:
        recipe = extract_webpage_data(req.url)
        if recipe == 'No HowToSteps found.' or recipe == "Failed to retrieve data.":
            raise ValueError("Could not scrape website")
        return JSONResponse(content={"recipe": recipe}) #return on success
    except Exception as e :
        raise HTTPException(status_code = 400, detail=str(e))

