import axios from "axios";

/**
 * Save a recipe to the backend.
 * - If slug === "new", it will POST a new recipe.
 * - Otherwise, it will PUT (update) the existing one.
 * @param {Object} draftRecipe - The recipe data to save
 * @param {string} slug - The recipe slug ("new" for a new recipe)
 * @param {string} token - The user's auth token
 * @returns {Promise<Object>} - The saved recipe data
 */
export async function saveRecipeService(draftRecipe, slug, token) {
  const updatePayload = {};

  if (draftRecipe.title !== undefined) updatePayload.title = draftRecipe.title;
  if (draftRecipe.image !== undefined) updatePayload.image = draftRecipe.image;
  if (draftRecipe.description !== undefined) updatePayload.description = draftRecipe.description;
  if (draftRecipe.ingredients !== undefined) updatePayload.ingredients = draftRecipe.ingredients;
  if (draftRecipe.instructions !== undefined) updatePayload.instructions = draftRecipe.instructions;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (slug === "new") {
    const res = await axios.post("http://localhost:8000/recipe/manualRecipe", updatePayload, config);
    return res.data;
  } else {
    const res = await axios.put(`http://localhost:8000/recipes/${slug}`, updatePayload, config);
    return res.data;
  }
}
