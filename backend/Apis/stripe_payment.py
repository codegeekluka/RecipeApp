"""
Stripe payment integration for premium subscriptions.
Handles checkout session creation and webhook processing.
"""
import logging
import os
from pathlib import Path

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.Apis.auth import get_current_user
from backend.database.database import get_db
from backend.database.db_models import User
from backend.services.subscription_service import upgrade_to_premium

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / "database" / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

# Configure Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    logging.warning("STRIPE_SECRET_KEY not found in environment variables!")

# Premium plan configuration
PREMIUM_PRICE_ID = os.getenv(
    "STRIPE_PREMIUM_PRICE_ID", "price_1234567890"
)  # Replace with your actual price ID
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateCheckoutSessionRequest(BaseModel):
    """Request model for creating checkout session"""
    pass


class CreateCheckoutSessionResponse(BaseModel):
    """Response model for checkout session"""
    checkout_url: str
    session_id: str


@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a Stripe Checkout session for premium upgrade.
    Returns the checkout URL to redirect the user.
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Please set STRIPE_SECRET_KEY.",
        )

    try:
        # Create Stripe Checkout session
        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": PREMIUM_PRICE_ID,
                    "quantity": 1,
                }
            ],
            mode="subscription",  # or "payment" for one-time payment
            success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment/cancel",
            metadata={
                "user_id": str(current_user.id),
                "username": current_user.username,
            },
        )

        logger.info(
            f"Created checkout session {checkout_session.id} for user {current_user.id}"
        )

        return CreateCheckoutSessionResponse(
            checkout_url=checkout_session.url,
            session_id=checkout_session.id,
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        raise HTTPException(
            status_code=500, detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.
    This endpoint should be configured in Stripe Dashboard to receive webhook events.
    """
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("STRIPE_WEBHOOK_SECRET not configured. Webhook verification disabled.")
        # In production, you should always verify webhooks
        # For now, we'll allow it but log a warning

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # Fallback: parse JSON without verification (NOT RECOMMENDED FOR PRODUCTION)
            import json
            event = json.loads(payload)

    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    event_type = event.get("type")
    event_data = event.get("data", {}).get("object", {})

    logger.info(f"Received Stripe webhook event: {event_type}")

    if event_type == "checkout.session.completed":
        # Payment successful - upgrade user to premium
        session = event_data
        user_id = int(session.get("metadata", {}).get("user_id", 0))

        if user_id:
            try:
                upgrade_to_premium(db, user_id)
                logger.info(f"Upgraded user {user_id} to premium via webhook")
            except Exception as e:
                logger.error(f"Error upgrading user {user_id}: {e}")

    elif event_type == "customer.subscription.created":
        # Subscription created
        subscription = event_data
        customer_id = subscription.get("customer")
        logger.info(f"Subscription created for customer {customer_id}")

    elif event_type == "customer.subscription.updated":
        # Subscription updated (e.g., renewed, cancelled)
        subscription = event_data
        customer_id = subscription.get("customer")
        status = subscription.get("status")
        logger.info(f"Subscription {status} for customer {customer_id}")

        # If subscription is cancelled or past_due, you might want to downgrade
        if status in ["canceled", "past_due", "unpaid"]:
            # Optionally downgrade user here
            logger.warning(f"Subscription {status} for customer {customer_id}")

    elif event_type == "customer.subscription.deleted":
        # Subscription deleted - optionally downgrade user
        subscription = event_data
        customer_id = subscription.get("customer")
        logger.info(f"Subscription deleted for customer {customer_id}")
        # You might want to downgrade the user here

    else:
        logger.info(f"Unhandled event type: {event_type}")

    return {"status": "success"}


@router.get("/payment/success")
async def payment_success(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Handle successful payment redirect.
    Verify the session and upgrade the user if payment was successful.
    """
    try:
        if not STRIPE_SECRET_KEY:
            return RedirectResponse(url=f"{FRONTEND_URL}/payment/error?reason=stripe_not_configured")

        # Retrieve the checkout session
        checkout_session = stripe.checkout.Session.retrieve(session_id)

        if checkout_session.payment_status == "paid":
            # Upgrade user to premium
            upgrade_to_premium(db, current_user.id)
            logger.info(f"Upgraded user {current_user.id} to premium via success page")

            return RedirectResponse(url=f"{FRONTEND_URL}/settings?upgraded=true")
        else:
            return RedirectResponse(url=f"{FRONTEND_URL}/payment/cancel")

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error verifying payment: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment/error?reason=verification_failed")
    except Exception as e:
        logger.error(f"Error processing payment success: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment/error?reason=unknown_error")








