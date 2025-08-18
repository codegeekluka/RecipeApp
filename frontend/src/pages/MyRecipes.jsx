import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import CookBookCard from "../components/pages/CookBookCard";
import "../styles/recipes/MyRecipes.css";
import TagDropdown from "../components/ui/TagDropdown";
import PillNav from "../components/layout/PillNav.jsx";

export default function MyRecipes() {
  const { recipes, setNavOrigin, fetchUserRecipes, user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [visibleCount, setVisibleCount] = useState(12); // initial load count

  const navigate = useNavigate();

  // Fetch fresh recipes when component mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      fetchUserRecipes(token);
    }
  }, [user, fetchUserRecipes]);
// Extract all tags (handle object or string)
    const allTags = Array.from(
        new Set(
        recipes.flatMap((r) => (r.tags || []).map(t => typeof t === 'string' ? t : t.name))
        )
    );

// Filtering logic
const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  
    const matchesFavorite = !showFavoritesOnly || recipe.favorite;
  
    const matchesTag =
      !selectedTag ||
      (recipe.tags || []).some(t => (typeof t === 'string' ? t : t.name) === selectedTag);
  
    return matchesSearch && matchesFavorite && matchesTag;
  });

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        setVisibleCount((prev) => prev + 8); // load 8 more
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCardClick = (slug) =>{
    setNavOrigin('/MyRecipes')
    navigate(`/recipe/${slug}`)
  }

  return (
    <div className="myrecipes-container">
      <div className="myrecipes-hero">
        <h1>My Recipes</h1>
        <p>Discover and manage your favorite recipes</p>
      </div>
      <PillNav />
      <h1 className="myrecipes-title">My Recipes</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search recipes by title..."
        className="myrecipes-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Filters */}
      <div className="myrecipes-filters">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={() => setShowFavoritesOnly((f) => !f)}
          />
          Favorites only
        </label>

        <TagDropdown
            options={allTags}
            selected={selectedTag}
            onChange={setSelectedTag}
            />
      </div>

      {/* Debug info 
      <div style={{ padding: '20px', color: '#666' }}>
        <p>Total recipes: {recipes.length}</p>
        <p>Filtered recipes: {filteredRecipes.length}</p>
        <p>Visible recipes: {Math.min(filteredRecipes.length, visibleCount)}</p>
      </div>*/}

      {/* Recipes Grid */}
      <div className="recipes-grid">
        {filteredRecipes.slice(0, visibleCount).map((recipe) => (
          <CookBookCard key={recipe.slug} recipe={recipe} onClick={() => handleCardClick(recipe.slug)}/>
        ))}
      </div>
    </div>
  );
}
