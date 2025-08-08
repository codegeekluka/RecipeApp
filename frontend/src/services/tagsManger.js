import axios from "axios";

export async function updateTags(slug, tags, token) {
  // Replace with your real API endpoint that updates tags
  const res = await axios.put(
    `http://localhost:8000/recipe/${slug}/tags`,
    { tags }, // sending array of tags to backend
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}
