"""
Subscription management endpoints.
Provides subscription status and session information.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import User
from backend.services.subscription_service import get_subscription_status

router = APIRouter()


@router.get("/subscription/status")
async def get_user_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's subscription status including:
    - is_premium: Whether user has premium subscription
    - sessions_used: Number of AI sessions used
    - sessions_remaining: Remaining free sessions (-1 for premium = unlimited)
    - sessions_limit: Total free sessions allowed (3 for free, -1 for premium)
    - last_used: Timestamp of last AI session
    - last_reset_date: Date when sessions were last reset
    """
    status = get_subscription_status(db, current_user.id)
    return status








