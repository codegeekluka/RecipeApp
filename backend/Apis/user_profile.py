import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload, selectinload

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import (
    User,
    UserBudgetPreference,
    UserCuisinePreference,
    UserDietaryRestriction,
    UserHealthGoal,
    UserSkillLevel,
)

router = APIRouter()


# Pydantic models for request/response
class UserProfileUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    age: Optional[int] = None
    profile_picture_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    theme_preference: Optional[str] = None


class OnboardingData(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    age: Optional[int] = None
    profile_picture_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None
    skill_level: Optional[str] = None
    cuisine_preferences: Optional[List[str]] = None
    health_goals: Optional[List[str]] = None
    budget_preferences: Optional[List[str]] = None
    how_heard_about: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    firstname: Optional[str]
    lastname: Optional[str]
    email: Optional[str]
    age: Optional[int]
    profile_picture_url: Optional[str]
    hero_image_url: Optional[str]
    onboarding_complete: bool
    how_heard_about: Optional[str]
    theme_preference: str
    dietary_restrictions: List[str]
    skill_level: Optional[str]
    cuisine_preferences: List[str]
    health_goals: List[str]
    budget_preferences: List[str]


# Default options for preferences
DEFAULT_DIETARY_RESTRICTIONS = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "nut-free",
    "pescatarian",
    "keto",
    "paleo",
    "low-carb",
    "halal",
    "kosher",
]

DEFAULT_CUISINES = [
    "italian",
    "mexican",
    "chinese",
    "japanese",
    "indian",
    "thai",
    "french",
    "mediterranean",
    "american",
    "greek",
    "spanish",
    "korean",
]

DEFAULT_HEALTH_GOALS = [
    "lose_weight",
    "gain_weight",
    "maintain_weight",
    "build_muscle",
    "improve_energy",
    "better_digestion",
    "heart_health",
]

DEFAULT_BUDGET_OPTIONS = ["cheap", "expensive", "something_in_between"]

DEFAULT_SKILL_LEVELS = ["beginner", "intermediate", "advanced"]


# Helper function to save uploaded files
def save_uploaded_file(file: UploadFile, folder: str) -> str:
    """Save uploaded file and return the URL path"""
    # Create uploads directory if it doesn't exist
    upload_dir = f"uploads/{folder}"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"{upload_dir}/{unique_filename}"

    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)

    # Return URL path (in production, this would be a full URL)
    return f"/uploads/{folder}/{unique_filename}"


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get current user's profile information"""
    try:
        # Optimized: Use selectinload for better performance with collections
        user = (
            db.query(User)
            .options(
                selectinload(User.dietary_restrictions),
                selectinload(User.cuisine_preferences),
                selectinload(User.health_goals),
                selectinload(User.budget_preferences),
                selectinload(User.skill_level_rel)
            )
            .filter(User.id == current_user.id)
            .first()
        )
        
        # Get user preferences (now loaded in single query)
        dietary_restrictions = [dr.restriction for dr in user.dietary_restrictions]
        cuisine_preferences = [cp.cuisine for cp in user.cuisine_preferences]
        health_goals = [hg.goal for hg in user.health_goals]
        budget_preferences = [bp.budget_type for bp in user.budget_preferences]

        # Get skill level
        skill_level = user.skill_level_rel

        return UserProfileResponse(
            id=int(user.id),
            username=str(user.username),
            firstname=str(user.firstname) if user.firstname else None,
            lastname=str(user.lastname) if user.lastname else None,
            email=str(user.email) if user.email else None,
            age=int(user.age) if user.age else None,
            profile_picture_url=str(user.profile_picture_url) if user.profile_picture_url else None,
            hero_image_url=str(user.hero_image_url) if user.hero_image_url else None,
            onboarding_complete=bool(user.onboarding_complete),
            how_heard_about=str(user.how_heard_about) if user.how_heard_about else None,
            theme_preference=str(user.theme_preference) if user.theme_preference else "system",
            dietary_restrictions=dietary_restrictions,
            skill_level=skill_level.skill_level if skill_level else None,
            cuisine_preferences=cuisine_preferences,
            health_goals=health_goals,
            budget_preferences=budget_preferences,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch user profile: {str(e)}"
        )


@router.post("/me/onboarding")
def complete_onboarding(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete user onboarding with profile and preferences"""
    try:
        # Update basic profile information
        if onboarding_data.firstname is not None:
            current_user.firstname = onboarding_data.firstname  # type: ignore
        if onboarding_data.lastname is not None:
            current_user.lastname = onboarding_data.lastname  # type: ignore
        if onboarding_data.age is not None:
            if onboarding_data.age < 0 or onboarding_data.age > 116:
                raise HTTPException(
                    status_code=400, detail="Age must be between 0 and 116"
                )
            current_user.age = onboarding_data.age  # type: ignore
        if onboarding_data.profile_picture_url is not None:
            current_user.profile_picture_url = onboarding_data.profile_picture_url  # type: ignore
        if onboarding_data.hero_image_url is not None:
            current_user.hero_image_url = onboarding_data.hero_image_url  # type: ignore
        if onboarding_data.how_heard_about is not None:
            current_user.how_heard_about = onboarding_data.how_heard_about  # type: ignore

        # Clear existing preferences
        db.query(UserDietaryRestriction).filter(
            UserDietaryRestriction.user_id == current_user.id
        ).delete()
        db.query(UserCuisinePreference).filter(
            UserCuisinePreference.user_id == current_user.id
        ).delete()
        db.query(UserHealthGoal).filter(
            UserHealthGoal.user_id == current_user.id
        ).delete()
        db.query(UserBudgetPreference).filter(
            UserBudgetPreference.user_id == current_user.id
        ).delete()
        db.query(UserSkillLevel).filter(
            UserSkillLevel.user_id == current_user.id
        ).delete()

        # Add new dietary restrictions
        if onboarding_data.dietary_restrictions:
            for restriction in onboarding_data.dietary_restrictions:
                db.add(
                    UserDietaryRestriction(
                        user_id=current_user.id, restriction=restriction
                    )
                )

        # Add new cuisine preferences
        if onboarding_data.cuisine_preferences:
            for cuisine in onboarding_data.cuisine_preferences:
                db.add(UserCuisinePreference(user_id=current_user.id, cuisine=cuisine))

        # Add new health goals
        if onboarding_data.health_goals:
            for goal in onboarding_data.health_goals:
                db.add(UserHealthGoal(user_id=current_user.id, goal=goal))

        # Add new budget preferences
        if onboarding_data.budget_preferences:
            for budget_type in onboarding_data.budget_preferences:
                db.add(
                    UserBudgetPreference(
                        user_id=current_user.id, budget_type=budget_type
                    )
                )

        # Add skill level
        if onboarding_data.skill_level:
            db.add(
                UserSkillLevel(
                    user_id=current_user.id, skill_level=onboarding_data.skill_level
                )
            )

        db.commit()

        return {"message": "Onboarding completed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to complete onboarding: {str(e)}"
        )


@router.patch("/me/onboarding-complete")
def mark_onboarding_complete(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Mark user onboarding as complete"""
    try:
        current_user.onboarding_complete = True  # type: ignore
        db.commit()
        return {"message": "Onboarding marked as complete"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to mark onboarding complete: {str(e)}"
        )


@router.post("/me/upload-profile-picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload profile picture"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Save file
        file_url = save_uploaded_file(file, "profile_pictures")

        # Update user profile
        current_user.profile_picture_url = file_url  # type: ignore
        db.commit()

        return {"profile_picture_url": file_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload profile picture: {str(e)}"
        )


@router.post("/me/upload-hero-image")
def upload_hero_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload hero section image"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Save file
        file_url = save_uploaded_file(file, "hero_images")

        # Update user profile
        current_user.hero_image_url = file_url  # type: ignore
        db.commit()

        return {"hero_image_url": file_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload hero image: {str(e)}"
        )


@router.delete("/me/delete-profile-picture")
def delete_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete profile picture"""
    try:
        # Set profile picture URL to null
        current_user.profile_picture_url = None  # type: ignore
        db.commit()

        return {"message": "Profile picture deleted successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete profile picture: {str(e)}"
        )


@router.delete("/me/delete-hero-image")
def delete_hero_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete hero section image"""
    try:
        # Set hero image URL to null
        current_user.hero_image_url = None  # type: ignore
        db.commit()

        return {"message": "Hero image deleted successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete hero image: {str(e)}"
        )


@router.get("/me/preferences/options")
def get_preference_options():
    """Get all available preference options for onboarding"""
    # This endpoint returns static data, so it should be very fast
    # No database queries needed
    return {
        "dietary_restrictions": DEFAULT_DIETARY_RESTRICTIONS,
        "cuisines": DEFAULT_CUISINES,
        "health_goals": DEFAULT_HEALTH_GOALS,
        "budget_options": DEFAULT_BUDGET_OPTIONS,
        "skill_levels": DEFAULT_SKILL_LEVELS,
    }


@router.put("/me/profile")
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile information"""
    try:
        if profile_data.firstname is not None:
            current_user.firstname = profile_data.firstname  # type: ignore
        if profile_data.lastname is not None:
            current_user.lastname = profile_data.lastname  # type: ignore
        if profile_data.age is not None:
            if profile_data.age < 0 or profile_data.age > 116:
                raise HTTPException(
                    status_code=400, detail="Age must be between 0 and 116"
                )
            current_user.age = profile_data.age  # type: ignore
        if profile_data.profile_picture_url is not None:
            current_user.profile_picture_url = profile_data.profile_picture_url  # type: ignore
        if profile_data.hero_image_url is not None:
            current_user.hero_image_url = profile_data.hero_image_url  # type: ignore
        if profile_data.theme_preference is not None:
            # Validate theme preference
            if profile_data.theme_preference not in ["light", "dark", "system"]:
                raise HTTPException(
                    status_code=400, detail="Theme preference must be 'light', 'dark', or 'system'"
                )
            current_user.theme_preference = profile_data.theme_preference  # type: ignore

        db.commit()
        return {"message": "Profile updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update profile: {str(e)}"
        )
