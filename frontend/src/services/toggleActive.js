// src/api/toggleActive.js
import axios from "axios";

export async function toggleActive(slug, token) {
  try {
    const res = await axios.put(
      `http://localhost:8000/recipe/${slug}/active`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.is_active;
  } catch (err) {
    console.error("Failed to toggle active status", err);
    throw err;
  }
}
