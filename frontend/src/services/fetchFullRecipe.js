import axios from "axios";

/**
 * Fetch a recipe from the API by slug
 * @param {string} slug - The recipe slug
 * @returns {Promise<object>} The recipe data
 */
export async function fetchFullRecipe(slug) {
  const start = Date.now();

  const res = await axios.get(`http://localhost:8000/recipes/${slug}`);
  console.log("fetchFullRecipe response:", res.data)
  // Optional: keep your artificial delay for smooth loading animations
  const elapsed = Date.now() - start;
  const delay = Math.max(0, 2000 - elapsed);

  return new Promise((resolve) => {
    setTimeout(() => resolve(res.data), delay);
  });
}
