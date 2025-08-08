// src/api/toggleFavorite.js
import axios from "axios";

export async function toggleFavorite(slug, token) {
  try {
    const res = await axios.put(
      `http://localhost:8000/recipe/${slug}/favorite`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.is_favorite;
  } catch (err) {
    console.error("Failed to toggle favorite", err);
    throw err;
  }
}
