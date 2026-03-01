import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Subscription service for managing user subscription status
 */
const subscriptionService = {
  /**
   * Get user subscription status
   * @returns {Promise<Object>} Subscription status object
   */
  async getSubscriptionStatus() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${API_BASE_URL}/subscription/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  },

  /**
   * Create Stripe checkout session
   * @returns {Promise<Object>} Checkout session with URL
   */
  async createCheckoutSession() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/payment/create-checkout-session`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
};

export default subscriptionService;








