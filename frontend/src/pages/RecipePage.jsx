import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/RecipePage.css'
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import RecipeHero from '../components/RecipeHero.jsx';
import { saveRecipeService } from '../services/saveRecipe.js';
import { fetchFullRecipe } from '../services/fetchFullRecipe.js';
import { updateTags } from '../services/tagsManger.js';

const RecipePage = () => {
    const { slug } = useParams();
    const { recipes } = useContext(AuthContext);
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("instructions");
    const [draftRecipe, setDraftRecipe] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState([])
    const token = localStorage.getItem('token');

    const navigate=useNavigate()

    const emptyRecipeTemplate = {
        slug: "new",
        image: "",  // or placeholder image URL
        title: "Recipe title",
        description: "Recipe description",
        category: "BREAKFAST",  // default or blank
        ingredients: ["Ingredient 1"],      // start with one blank item
        instructions: ["Step 1"],     // start with one blank item
        favorite: false,
        is_active: false,
        tags: []
      };

    useEffect(() => {
        let isMounted = true;
        if (slug === "new") {
            // Initialize new recipe state for manual add
            setRecipe(emptyRecipeTemplate);
            setDraftRecipe(emptyRecipeTemplate);
            setEditMode(true);
            setLoading(false);
            return;
          }

        const localRecipe = recipes.find(r => r.slug === slug);

        const loadRecipe = async () => {
          try {
            setLoading(true);
            const fullRecipe= await fetchFullRecipe(slug)
            console.log("setRecipe with tags:", fullRecipe.tags);
            if (isMounted) {
                setRecipe(fullRecipe);
                setDraftRecipe(fullRecipe);
                setTags(fullRecipe.tags || []);
                setLoading(false);
            }
          } catch (err) {
            console.error("Failed to fetch recipe:", err);
            if (isMounted) setLoading(false);
          }
        };
      
        if(localRecipe){
          setRecipe(localRecipe); // show immediate content
          setDraftRecipe(localRecipe);// but still refresh from API
          setTags(localRecipe.tags || [])
        }

        loadRecipe()
        

      
        return () => {
          isMounted = false;
        };
      }, [slug, recipes]);

      const handleAddTag = async (newTag) => {
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);
    
        try {
            await updateTags(recipe.slug, updatedTags, token);
          } catch (err) {
            if (err.response?.status === 403) {
              alert("Session expired. Please login again.");
              navigate('/');
            } else {
              alert("Failed to save tags");
            }
            setTags(tags); // revert on error
          }
      };
    
      const handleRemoveTag = async (tagToRemove) => {
        const updatedTags = tags.filter(t => t !== tagToRemove);
        setTags(updatedTags);
    
        try {
            await updateTags(recipe.slug, updatedTags, token);
          } catch (err) {
            if (err.response?.status === 403) {
              alert("Session expired. Please login again.");
              navigate('/');
            } else {
              alert("Failed to save tags");
            }
            setTags(tags); // revert on error
          }
      };
      
      const startEditing = () => setEditMode(true);
      
      const cancelEditing = () => {
        setDraftRecipe(recipe);
        setEditMode(false);
      };
      
      const saveRecipe = async () => {
        try {
          // Build the update payload only with defined fields
              const savedRecipe = await saveRecipeService(draftRecipe, slug, token)
              setRecipe(draftRecipe);
              setEditMode(false);

              if (slug === "new") {
                navigate(`/recipe/${savedRecipe.slug}`);
            }
          
        } catch (err) {
            if(err.response?.status===403){
                alert("Session expired. Please login again")
                navigate('/')
            } else{
                alert("Error saving recipe.");
            }    
        }
      };
      
      
      if (loading) return (
        <div className="loader-container">
            <LoadingSpinner />
        </div>
      ) 
      if (!recipe) return <div>Recipe not found</div>;

    return (
        <div className="recipe-container">
            {/* HEADER IMAGE */}
            <RecipeHero
              recipe={recipe}
              tags={tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              editMode={editMode}
              startEditing={startEditing}
              saveRecipe={saveRecipe}
              cancelEditing={cancelEditing}
              navigate={navigate}
            />

            {/* RECIPE CONTENT */}
            <div className="recipe-content">
                {editMode ? (
                    <input
                        className="recipe-input"
                        value={draftRecipe?.title || ""}
                        onChange={(e) =>
                        setDraftRecipe({ ...draftRecipe, title: e.target.value })
                        }
                    />
                    ) : (
                    <h1>{recipe?.title}</h1>
                )}
            
                {editMode ? (
                    <textarea
                        className="recipe-textarea"
                        value={draftRecipe?.description || ""}
                        onChange={(e) =>
                        setDraftRecipe({ ...draftRecipe, description: e.target.value })
                        }
                    />
                    ) : (
                    <p className="description-recipe">{recipe?.description}</p>
                )}

                {/* NUTRITION INFO */}
                <div className="nutrition-info">
                <div>🍽  125 Kcal</div>
                <div>💪  24g Proteins</div>
                <div>🥗  125g Carbs</div>
                <div>🧈  75g Fats</div>
                </div>

                {/* SLIDER / TABS */}
                <div className="tabs">
                <button
                    className={activeTab === "ingredients" ? "active" : ""}
                    onClick={() => setActiveTab("ingredients")}
                >
                    Ingredients
                </button>
                <button
                    className={activeTab === "instructions" ? "active" : ""}
                    onClick={() => setActiveTab("instructions")}
                >
                    Instructions
                </button>
                </div>

    

                {/* TAB CONTENT */}
                <div className="tab-content">
                {activeTab === "ingredients" && (
                    editMode ? (
                        draftRecipe?.ingredients.map((item, index) => (
                          <input
                            className="ingredients-input"
                            key={index}
                            value={item}
                            onChange={(e) => {
                              const updated = [...draftRecipe.ingredients];
                              updated[index] = e.target.value;
                              setDraftRecipe({ ...draftRecipe, ingredients: updated });
                            }}
                          />
                        ))
                      ) : (
                        <ul>
                          {recipe?.ingredients.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )
                      
                )}
                {activeTab === "instructions" && (
                    editMode ? (
                        draftRecipe?.instructions.map((item, index) => (
                          <textarea
                            className="instructions-textarea"
                            key={index}
                            value={item}
                            onChange={(e) => {
                              const updated = [...draftRecipe.instructions];
                              updated[index] = e.target.value;
                              setDraftRecipe({ ...draftRecipe, instructions: updated });
                            }}
                          />
                        ))
                      ) : (
                        <ul>
                          {recipe?.instructions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )
                      
                )}
                </div>
            </div>
        </div>
    );
};

export default RecipePage;
