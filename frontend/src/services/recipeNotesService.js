import axios from "axios";

const BASE_URL = "http://localhost:8000";

/**
 * Get user's note for a recipe
 * @param {string} slug - The recipe slug
 * @param {string} token - The user's auth token
 * @returns {Promise<Object>} - The note data
 */
export async function getRecipeNote(slug, token) {
  try {
    const response = await axios.get(`${BASE_URL}/recipes/${slug}/note`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { id: null, note: null, created_at: null, updated_at: null };
    }
    throw error;
  }
}

/**
 * Create or update user's note for a recipe
 * @param {string} slug - The recipe slug
 * @param {string} note - The note text
 * @param {string} token - The user's auth token
 * @returns {Promise<Object>} - The saved note data
 */
export async function saveRecipeNote(slug, note, token) {
  try {
    const response = await axios.post(
      `${BASE_URL}/recipes/${slug}/note`,
      { note },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user's note for a recipe
 * @param {string} slug - The recipe slug
 * @param {string} note - The note text
 * @param {string} token - The user's auth token
 * @returns {Promise<Object>} - The updated note data
 */
export async function updateRecipeNote(slug, note, token) {
  try {
    const response = await axios.put(
      `${BASE_URL}/recipes/${slug}/note`,
      { note },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete user's note for a recipe
 * @param {string} slug - The recipe slug
 * @param {string} token - The user's auth token
 * @returns {Promise<void>}
 */
export async function deleteRecipeNote(slug, token) {
  try {
    await axios.delete(`${BASE_URL}/recipes/${slug}/note`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw error;
  }
}








