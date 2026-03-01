import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/recipes/RecipePage.css'
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RecipeHero from '../components/pages/RecipeHero.jsx';
import DeleteModal from '../components/ui/DeleteModal.jsx';

import { saveRecipeService } from '../services/saveRecipe.js';
import { fetchFullRecipe } from '../services/fetchFullRecipe.js';
import { updateTags } from '../services/tagsManger.js';
import { getRecipeNote, saveRecipeNote } from '../services/recipeNotesService.js';

const RecipePage = () => {
    const { slug } = useParams();
    const { recipes } = useContext(AuthContext);
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("instructions");
    const [draftRecipe, setDraftRecipe] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState([])
    const [initialRecipe, setInitialRecipe] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteItemType, setDeleteItemType] = useState(null); // 'ingredient' or 'instruction'
    const [deleteItemIndex, setDeleteItemIndex] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const token = localStorage.getItem('token');

    const navigate=useNavigate()

    // Helper function to format time from hours and minutes
    const formatTime = (hours, minutes) => {
        // Convert to strings for consistent comparison
        const hoursStr = hours?.toString() || "";
        const minutesStr = minutes?.toString() || "";
        
        // If both are empty, return null
        if (!hoursStr && !minutesStr) return null;
        
        // If both have values
        if (hoursStr && minutesStr) {
            // Don't show hours if it's 0
            if (hoursStr === "0") return `${minutesStr}m`;
            return `${hoursStr}h ${minutesStr}m`;
        }
        
        // If only hours has a value (and it's not 0)
        if (hoursStr && hoursStr !== "0") return `${hoursStr}h`;
        
        // If only minutes has a value
        if (minutesStr) return `${minutesStr}m`;
        
        return null;
    };

    // Helper function to calculate total time from prep and cook times
    const calculateTotalTime = (prepHours, prepMinutes, cookHours, cookMinutes) => {
        const prepTotal = (parseInt(prepHours) || 0) * 60 + (parseInt(prepMinutes) || 0);
        const cookTotal = (parseInt(cookHours) || 0) * 60 + (parseInt(cookMinutes) || 0);
        const totalMinutes = prepTotal + cookTotal;
        
        if (totalMinutes === 0) return null;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    // Helper function to parse time string into hours and minutes
    const parseTime = (timeString) => {
        if (!timeString) return { hours: "", minutes: "" };
        
        const hoursMatch = timeString.match(/(\d+)h/);
        const minutesMatch = timeString.match(/(\d+)m/);
        
        return {
            hours: hoursMatch ? hoursMatch[1] : "",
            minutes: minutesMatch ? minutesMatch[1] : ""
        };
    };

    const emptyRecipeTemplate = {
        slug: "new",
        image: "",  // or placeholder image URL
        title: "Recipe title",
        description: "Recipe description",
        ingredients: ["Ingredient 1"],      // start with one blank item
        instructions: ["Step 1"],     // start with one blank item
        favorite: false,
        is_active: false,
        tags: [],
        prep_time: null,
        cook_time: null,
        total_time: null,
        prep_hours: "",
        prep_minutes: "",
        cook_hours: "",
        cook_minutes: "",
        total_hours: "",
        total_minutes: ""
      };

    useEffect(() => {
        let isMounted = true;
        if (slug === "new") {
            // Initialize new recipe state for manual add
            setRecipe(emptyRecipeTemplate);
            setDraftRecipe(emptyRecipeTemplate);
            setEditMode(true);
            setLoading(false);
            setInitialRecipe(true)
            return;
          }

        const localRecipe = recipes.find(r => r.slug === slug);

        const loadRecipe = async () => {
          try {
            setLoading(true);
            const fullRecipe= await fetchFullRecipe(slug)
        
            if (isMounted) {
                setRecipe(fullRecipe);
                
                // Parse times for editing
                const prepTime = parseTime(fullRecipe.prep_time);
                const cookTime = parseTime(fullRecipe.cook_time);
                const totalTime = parseTime(fullRecipe.total_time);
                
                setDraftRecipe({
                    ...fullRecipe,
                    prep_hours: prepTime.hours,
                    prep_minutes: prepTime.minutes,
                    cook_hours: cookTime.hours,
                    cook_minutes: cookTime.minutes,
                    total_hours: totalTime.hours,
                    total_minutes: totalTime.minutes
                });
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
          
          // Parse times for editing
          const prepTime = parseTime(localRecipe.prep_time);
          const cookTime = parseTime(localRecipe.cook_time);
          const totalTime = parseTime(localRecipe.total_time);
          
          setDraftRecipe({
            ...localRecipe,
            prep_hours: prepTime.hours,
            prep_minutes: prepTime.minutes,
            cook_hours: cookTime.hours,
            cook_minutes: cookTime.minutes,
            total_hours: totalTime.hours,
            total_minutes: totalTime.minutes
          });
          setTags(localRecipe.tags || [])
        }
        
        // Load recipe note
        const loadNote = async () => {
          if (slug !== "new" && token) {
            try {
              const note = await getRecipeNote(slug, token);
              setNoteText(note.note || "");
            } catch (err) {
              console.error("Failed to fetch note:", err);
            }
          }
        };
        
        loadRecipe();
        loadNote();
        return () => {
          isMounted = false;
        };
      }, [slug, recipes, token]);

      const handleAddTag = async (newTag) => {
        // Handle both single tags and arrays of tags
        const tagsToAdd = Array.isArray(newTag) ? newTag : [newTag];
        const updatedTags = [...tags, ...tagsToAdd];
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
              console.log(draftRecipe)
              const savedRecipe = await saveRecipeService(draftRecipe, slug, token)
              if (savedRecipe && savedRecipe.slug) {
                setRecipe(draftRecipe);
                setEditMode(false);
                setInitialRecipe(false);
          
                if (slug === "new") {
                  navigate(`/recipe/${savedRecipe.slug}`);
                }
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

      // Handler functions for ingredients
      const addIngredient = () => {
        const updated = [...(draftRecipe?.ingredients || []), ""];
        setDraftRecipe({ ...draftRecipe, ingredients: updated });
      };

      const removeIngredient = (index) => {
        setDeleteItemType('ingredient');
        setDeleteItemIndex(index);
        setDeleteModalOpen(true);
      };

      // Handler functions for instructions
      const addInstruction = () => {
        const updated = [...(draftRecipe?.instructions || []), ""];
        setDraftRecipe({ ...draftRecipe, instructions: updated });
      };

      const removeInstruction = (index) => {
        setDeleteItemType('instruction');
        setDeleteItemIndex(index);
        setDeleteModalOpen(true);
      };

      // Handle delete confirmation
      const handleDeleteConfirm = () => {
        if (deleteItemType === 'ingredient' && deleteItemIndex !== null) {
          const updated = draftRecipe.ingredients.filter((_, i) => i !== deleteItemIndex);
          setDraftRecipe({ ...draftRecipe, ingredients: updated });
        } else if (deleteItemType === 'instruction' && deleteItemIndex !== null) {
          const updated = draftRecipe.instructions.filter((_, i) => i !== deleteItemIndex);
          setDraftRecipe({ ...draftRecipe, instructions: updated });
        }
        setDeleteModalOpen(false);
        setDeleteItemType(null);
        setDeleteItemIndex(null);
      };

      // Handle delete cancel
      const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setDeleteItemType(null);
        setDeleteItemIndex(null);
      };

      // Handle note save
      const handleSaveNote = async () => {
        if (slug === "new" || !token) return;
        
        setIsSavingNote(true);
        try {
          await saveRecipeNote(slug, noteText, token);
        } catch (err) {
          if (err.response?.status === 403) {
            alert("Session expired. Please login again.");
            navigate('/');
          } else {
            alert("Error saving note.");
          }
        } finally {
          setIsSavingNote(false);
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
              initialRecipe={initialRecipe}
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

                {/* COOKING TIMES */}
                {editMode ? (
                    <div className="cooking-times-edit">
                        <div className="time-edit-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <div className="time-label">Prep Time</div>
                            <div className="time-inputs">
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={draftRecipe?.prep_hours || ""}
                                    onChange={(e) => {
                                        const hours = e.target.value;
                                        const minutes = draftRecipe?.prep_minutes || "";
                                        const totalTime = formatTime(hours, minutes);
                                        const calculatedTotalTime = calculateTotalTime(
                                            hours, 
                                            minutes, 
                                            draftRecipe?.cook_hours || "", 
                                            draftRecipe?.cook_minutes || ""
                                        );
                                        setDraftRecipe({ 
                                            ...draftRecipe, 
                                            prep_hours: hours,
                                            prep_time: totalTime,
                                            total_time: calculatedTotalTime
                                        });
                                    }}
                                    className="time-input"
                                />
                                <span>h</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={draftRecipe?.prep_minutes || ""}
                                    onChange={(e) => {
                                        const minutes = e.target.value;
                                        const hours = draftRecipe?.prep_hours || "";
                                        const totalTime = formatTime(hours, minutes);
                                        const calculatedTotalTime = calculateTotalTime(
                                            hours, 
                                            minutes, 
                                            draftRecipe?.cook_hours || "", 
                                            draftRecipe?.cook_minutes || ""
                                        );
                                        setDraftRecipe({ 
                                            ...draftRecipe, 
                                            prep_minutes: minutes,
                                            prep_time: totalTime,
                                            total_time: calculatedTotalTime
                                        });
                                    }}
                                    className="time-input"
                                />
                                <span>m</span>
                            </div>
                        </div>
                        <div className="time-edit-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                                <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                                <path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"/>
                                <path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                            </svg>
                            <div className="time-label">Cook Time</div>
                            <div className="time-inputs">
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={draftRecipe?.cook_hours || ""}
                                    onChange={(e) => {
                                        const hours = e.target.value;
                                        const minutes = draftRecipe?.cook_minutes || "";
                                        const totalTime = formatTime(hours, minutes);
                                        const calculatedTotalTime = calculateTotalTime(
                                            draftRecipe?.prep_hours || "", 
                                            draftRecipe?.prep_minutes || "",
                                            hours, 
                                            minutes
                                        );
                                        setDraftRecipe({ 
                                            ...draftRecipe, 
                                            cook_hours: hours,
                                            cook_time: totalTime,
                                            total_time: calculatedTotalTime
                                        });
                                    }}
                                    className="time-input"
                                />
                                <span>h</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={draftRecipe?.cook_minutes || ""}
                                    onChange={(e) => {
                                        const minutes = e.target.value;
                                        const hours = draftRecipe?.cook_hours || "";
                                        const totalTime = formatTime(hours, minutes);
                                        const calculatedTotalTime = calculateTotalTime(
                                            draftRecipe?.prep_hours || "", 
                                            draftRecipe?.prep_minutes || "",
                                            hours, 
                                            minutes
                                        );
                                        setDraftRecipe({ 
                                            ...draftRecipe, 
                                            cook_minutes: minutes,
                                            cook_time: totalTime,
                                            total_time: calculatedTotalTime
                                        });
                                    }}
                                    className="time-input"
                                />
                                <span>m</span>
                            </div>
                        </div>
                        <div className="time-edit-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                                <line x1="12" y1="12" x2="12" y2="6"/>
                            </svg>
                            <div className="time-label">Total Time</div>
                            <div className="time-value">{draftRecipe?.total_time || "N/A"}</div>
                        </div>
                    </div>
                ) : (
                    <div className="cooking-times">
                        <div className="time-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <div className="time-label">Prep Time</div>
                            <div className="time-value">{recipe?.prep_time || "N/A"}</div>
                        </div>
                        <div className="time-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                                <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                                <path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"/>
                                <path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                            </svg>
                            <div className="time-label">Cook Time</div>
                            <div className="time-value">{recipe?.cook_time || "N/A"}</div>
                        </div>
                        <div className="time-card">
                            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                                <line x1="12" y1="12" x2="12" y2="6"/>
                            </svg>
                            <div className="time-label">Total Time</div>
                            <div className="time-value">{recipe?.total_time || "N/A"}</div>
                        </div>
                    </div>
                )}

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
                <button
                    className={activeTab === "notes" ? "active" : ""}
                    onClick={() => setActiveTab("notes")}
                >
                    Notes
                </button>
                <button
                    className={activeTab === "reviews" ? "active" : ""}
                    onClick={() => setActiveTab("reviews")}
                >
                    Reviews
                </button>
                </div>

                {/* TAB CONTENT */}
                <div className="tab-content">
                {activeTab === "ingredients" && (
                    editMode ? (
                        <>
                          {draftRecipe?.ingredients.map((item, index) => (
                            <div key={index} className="edit-item-wrapper">
                              <input
                                className="ingredients-input"
                                value={item}
                                onChange={(e) => {
                                  const updated = [...draftRecipe.ingredients];
                                  updated[index] = e.target.value;
                                  setDraftRecipe({ ...draftRecipe, ingredients: updated });
                                }}
                              />
                              <button
                                className="remove-item-btn"
                                onClick={() => removeIngredient(index)}
                                type="button"
                                title="Remove ingredient"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            className="add-item-btn"
                            onClick={addIngredient}
                            type="button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Ingredient
                          </button>
                        </>
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
                        <>
                          {draftRecipe?.instructions.map((item, index) => (
                            <div key={index} className="edit-item-wrapper">
                              <textarea
                                className="instructions-textarea"
                                value={item}
                                onChange={(e) => {
                                  const updated = [...draftRecipe.instructions];
                                  updated[index] = e.target.value;
                                  setDraftRecipe({ ...draftRecipe, instructions: updated });
                                }}
                              />
                              <button
                                className="remove-item-btn"
                                onClick={() => removeInstruction(index)}
                                type="button"
                                title="Remove step"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            className="add-item-btn"
                            onClick={addInstruction}
                            type="button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Step
                          </button>
                        </>
                      ) : (
                        <ol>
                          {recipe?.instructions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ol>
                      )
                      
                )}
                {activeTab === "notes" && (
                    <div className="notes-tab-content">
                        <textarea
                            className="notes-textarea"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your personal notes about this recipe..."
                            rows={10}
                        />
                        <button
                            className="save-note-btn"
                            onClick={handleSaveNote}
                            disabled={isSavingNote}
                            type="button"
                        >
                            {isSavingNote ? "Saving..." : "Save Note"}
                        </button>
                    </div>
                )}
                {activeTab === "reviews" && (
                    <div className="reviews-tab-content">
                        <div className="reviews-placeholder">
                            <div className="stars-placeholder">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className="star-icon"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="reviews-placeholder-text">Reviews coming soon</p>
                        </div>
                    </div>
                )}
                </div>
            </div>
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={handleDeleteCancel}
                onDelete={handleDeleteConfirm}
                title={deleteItemType === 'ingredient' ? "Delete ingredient?" : "Delete step?"}
                description={deleteItemType === 'ingredient' 
                    ? "Are you sure you want to delete this ingredient?" 
                    : "Are you sure you want to delete this step?"}
            />
        </div>
    );
};

export default RecipePage;
