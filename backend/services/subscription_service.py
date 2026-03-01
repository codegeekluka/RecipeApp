"""
Subscription service for managing freemium model:
- Tracks AI chat sessions per user
- Enforces 3 free sessions limit
- Handles premium upgrades
- Resets sessions every 30 days
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import User, UserSubscription

logger = logging.getLogger(__name__)

# Constants
FREE_SESSIONS_LIMIT = 20  # Raised for demo; was 3
RESET_PERIOD_DAYS = 30


def get_or_create_subscription(
    db: Session, user_id: int
) -> UserSubscription:
    """Get or create a subscription record for a user"""
    subscription = (
        db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    )

    if not subscription:
        subscription = UserSubscription(
            user_id=user_id,
            sessions_used=0,
            is_premium=False,
            last_reset_date=datetime.now(timezone.utc),
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        logger.info(f"Created new subscription record for user {user_id}")

    return subscription


def reset_sessions_if_needed(
    db: Session, subscription: UserSubscription
) -> UserSubscription:
    """Reset sessions_used if 30 days have passed since last_reset_date"""
    now = datetime.now(timezone.utc)
    last_reset = subscription.last_reset_date

    if last_reset:
        days_since_reset = (now - last_reset).days
        if days_since_reset >= RESET_PERIOD_DAYS:
            subscription.sessions_used = 0
            subscription.last_reset_date = now
            db.commit()
            db.refresh(subscription)
            logger.info(
                f"Reset sessions for user {subscription.user_id} after {days_since_reset} days"
            )

    return subscription


def check_session_limit(
    db: Session, user_id: int, increment: bool = False
) -> tuple[bool, int, int]:
    """
    Check if user can use an AI session.
    Returns: (can_use, sessions_used, sessions_remaining)
    """
    subscription = get_or_create_subscription(db, user_id)
    subscription = reset_sessions_if_needed(db, subscription)

    # Premium users have unlimited sessions
    if subscription.is_premium:
        return (True, subscription.sessions_used, -1)  # -1 means unlimited

    # Check if free limit is reached
    can_use = subscription.sessions_used < FREE_SESSIONS_LIMIT
    sessions_remaining = max(0, FREE_SESSIONS_LIMIT - subscription.sessions_used)

    if increment and can_use:
        subscription.sessions_used += 1
        subscription.last_used = datetime.now(timezone.utc)
        db.commit()
        db.refresh(subscription)
        logger.info(
            f"Incremented session count for user {user_id}: {subscription.sessions_used}/{FREE_SESSIONS_LIMIT}"
        )

    return (can_use, subscription.sessions_used, sessions_remaining)


def increment_session_usage(
    db: Session, user_id: int
) -> UserSubscription:
    """Increment session usage for a user"""
    subscription = get_or_create_subscription(db, user_id)
    subscription = reset_sessions_if_needed(db, subscription)

    if not subscription.is_premium:
        subscription.sessions_used += 1

    subscription.last_used = datetime.now(timezone.utc)
    db.commit()
    db.refresh(subscription)

    return subscription


def get_subscription_status(
    db: Session, user_id: int
) -> dict:
    """Get subscription status for a user"""
    subscription = get_or_create_subscription(db, user_id)
    subscription = reset_sessions_if_needed(db, subscription)

    if subscription.is_premium:
        return {
            "is_premium": True,
            "sessions_used": subscription.sessions_used,
            "sessions_remaining": -1,  # Unlimited
            "sessions_limit": -1,
            "last_used": subscription.last_used.isoformat() if subscription.last_used else None,
            "last_reset_date": subscription.last_reset_date.isoformat() if subscription.last_reset_date else None,
        }

    sessions_remaining = max(0, FREE_SESSIONS_LIMIT - subscription.sessions_used)
    return {
        "is_premium": False,
        "sessions_used": subscription.sessions_used,
        "sessions_remaining": sessions_remaining,
        "sessions_limit": FREE_SESSIONS_LIMIT,
        "last_used": subscription.last_used.isoformat() if subscription.last_used else None,
        "last_reset_date": subscription.last_reset_date.isoformat() if subscription.last_reset_date else None,
    }


def upgrade_to_premium(db: Session, user_id: int) -> UserSubscription:
    """Upgrade user to premium"""
    subscription = get_or_create_subscription(db, user_id)
    subscription.is_premium = True
    db.commit()
    db.refresh(subscription)
    logger.info(f"Upgraded user {user_id} to premium")
    return subscription


async def check_ai_session_limit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency function to check if user can use AI assistant.
    Raises HTTP 402 if limit exceeded.
    """
    can_use, sessions_used, sessions_remaining = check_session_limit(
        db, current_user.id, increment=False
    )

    if not can_use:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Upgrade to Premium",
                "sessions_used": sessions_used,
                "sessions_limit": FREE_SESSIONS_LIMIT,
                "sessions_remaining": sessions_remaining,
            },
        )

    return current_user








