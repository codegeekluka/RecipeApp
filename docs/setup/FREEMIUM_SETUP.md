# Freemium Model Setup Guide

This guide explains how to set up and configure the freemium model for AI cooking sessions.

## Overview

The freemium model provides:
- **3 free AI cooking sessions** per user (resets every 30 days)
- **Premium subscription** via Stripe for unlimited sessions
- Automatic session tracking and limit enforcement
- Upgrade prompts when free sessions are exhausted

## Backend Setup

### 1. Database Migration

Run the Alembic migration to create the `user_subscription` table:

```bash
cd backend
alembic upgrade head
```

This creates the `user_subscription` table with:
- `user_id` (unique, foreign key to user)
- `sessions_used` (integer, default 0)
- `is_premium` (boolean, default false)
- `last_reset_date` (timestamp)
- `last_used` (timestamp, nullable)

### 2. Environment Variables

Add the following to your `.env` file (in `backend/database/.env`):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Stripe webhook signing secret
STRIPE_PREMIUM_PRICE_ID=price_...  # Your Stripe price ID for premium subscription

# Frontend URL (for redirects after payment)
FRONTEND_URL=http://localhost:5173  # Or your production URL
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs `stripe>=7.0.0` and other required packages.

### 4. Stripe Setup

1. **Create a Product and Price in Stripe Dashboard:**
   - Go to Stripe Dashboard → Products
   - Create a new product (e.g., "Premium Subscription")
   - Create a recurring price (monthly/yearly) or one-time payment
   - Copy the Price ID (starts with `price_`)
   - Set `STRIPE_PREMIUM_PRICE_ID` in your `.env`

2. **Configure Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-backend-url.com/payment/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. API Endpoints

The following endpoints are automatically registered:

- `GET /subscription/status` - Get user's subscription status
- `POST /payment/create-checkout-session` - Create Stripe checkout session
- `POST /payment/stripe/webhook` - Handle Stripe webhook events
- `GET /payment/success` - Handle successful payment redirect

## Frontend Setup

### 1. Components

The following components are included:
- `UpgradeModal.jsx` - Modal prompting users to upgrade
- `subscriptionService.js` - Service for subscription API calls

### 2. Integration

The freemium system is integrated into:
- `Cheffy.jsx` - AI assistant page (shows session counter and upgrade modal)
- `aiAssistantStore.js` - Handles 402 responses and shows upgrade modal

### 3. Session Counter Display

The session counter appears in the chat header:
- Free users: Shows "Sessions: X / 3"
- Premium users: Shows "Premium ∞"

## How It Works

### Session Tracking

1. **Session Limit Check:**
   - Before each AI request (`/ai/ask` or `/ai/upload_audio`), the `check_ai_session_limit` dependency runs
   - It checks if the user has exceeded 3 free sessions (unless premium)
   - Returns HTTP 402 if limit exceeded

2. **Session Increment:**
   - After the check passes, `increment_session_usage` is called
   - Only increments for non-premium users
   - Updates `sessions_used` and `last_used` timestamp

3. **30-Day Reset:**
   - `reset_sessions_if_needed` checks if 30 days have passed since `last_reset_date`
   - Automatically resets `sessions_used` to 0 if needed
   - Updates `last_reset_date` to current time

### Premium Upgrade Flow

1. **User hits limit:**
   - API returns HTTP 402 with session details
   - Frontend catches 402 and shows `UpgradeModal`

2. **User clicks "Upgrade to Premium":**
   - Frontend calls `/payment/create-checkout-session`
   - Backend creates Stripe Checkout session
   - User is redirected to Stripe Checkout

3. **Payment Success:**
   - Stripe webhook calls `/payment/stripe/webhook`
   - Backend sets `is_premium = True` for the user
   - User is redirected to success page

4. **Frontend Refresh:**
   - After redirect, frontend fetches updated subscription status
   - Session counter shows "Premium ∞"

## Testing

### Test Free Session Limit

1. Create a test user account
2. Make 3 AI assistant requests
3. On the 4th request, you should see the upgrade modal

### Test Premium Upgrade

1. Use Stripe test mode
2. Use test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify user is marked as premium in database
5. Verify unlimited sessions work

### Test 30-Day Reset

1. Manually set `last_reset_date` to 31 days ago in database
2. Make an AI request
3. Verify `sessions_used` resets to 0

## Database Queries

### Check User Subscription Status

```sql
SELECT * FROM user_subscription WHERE user_id = 1;
```

### Manually Upgrade User to Premium

```sql
UPDATE user_subscription 
SET is_premium = true 
WHERE user_id = 1;
```

### Reset Sessions for Testing

```sql
UPDATE user_subscription 
SET sessions_used = 0, 
    last_reset_date = NOW() 
WHERE user_id = 1;
```

## Troubleshooting

### Upgrade Modal Not Showing

- Check browser console for errors
- Verify 402 response is being caught in `aiAssistantStore.js`
- Ensure `showUpgradeModal` state is being set correctly

### Stripe Checkout Not Working

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check `STRIPE_PREMIUM_PRICE_ID` matches your Stripe price ID
- Ensure `FRONTEND_URL` is correct for redirects

### Webhook Not Upgrading Users

- Check Stripe Dashboard → Webhooks for delivery logs
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check backend logs for webhook processing errors
- Ensure webhook endpoint is publicly accessible

### Sessions Not Resetting

- Check `last_reset_date` in database
- Verify `reset_sessions_if_needed` is being called
- Check backend logs for reset operations

## Production Deployment

### Render (Backend)

1. Add environment variables in Render dashboard
2. Ensure webhook URL is publicly accessible
3. Use production Stripe keys (not test keys)

### Vercel (Frontend)

1. Set `VITE_API_BASE_URL` to your Render backend URL
2. Ensure CORS is configured correctly in backend

### Stripe Webhook

1. Update webhook URL to production backend URL
2. Use production webhook signing secret
3. Test webhook delivery in Stripe Dashboard

## Security Notes

- Never commit Stripe keys to version control
- Use environment variables for all secrets
- Verify webhook signatures in production
- Use HTTPS for all payment-related endpoints
- Implement rate limiting on checkout session creation

## Support

For issues or questions:
1. Check backend logs for errors
2. Verify environment variables are set correctly
3. Test with Stripe test mode first
4. Check Stripe Dashboard for payment/webhook status

