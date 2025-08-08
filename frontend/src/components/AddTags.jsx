import { useState, useRef, useEffect } from "react";
import '../styles/AddTags.css'

const DEFAULT_TAGS = ["cheap", "fast", "vegetarian", "gluten-free", "easy", "healthy"];

export default function TagsManager({ tags, onAddTag, onRemoveTag }) {
  const [showPopup, setShowPopup] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [selectedDefaults, setSelectedDefaults] = useState([]);
  const popupRef = useRef();

  // Close popup if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
        setSelectedDefaults([]);
        setCustomTag("");
      }
    }
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup]);

  const toggleDefaultTag = (tag) => {
    setSelectedDefaults((prev) =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addSelectedTags = () => {
    selectedDefaults.forEach(tag => {
      if (!tags.includes(tag)) onAddTag(tag);
    });
    setSelectedDefaults([]);
    setShowPopup(false);
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
      setCustomTag("");
      setShowPopup(false);
    }
  };

  return (
    <>
      <button
        className="icon-button add-tags-btn"
        onClick={() => setShowPopup(!showPopup)}
        title="Add Tags"
        aria-haspopup="true"
        aria-expanded={showPopup}
      >
        <svg width="28" height="28" fill="none" stroke="#333" strokeWidth="3" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showPopup && (
        <div className="tags-popup" ref={popupRef} role="dialog" aria-modal="true">
          <div className="default-tags">
            {DEFAULT_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`default-tag ${selectedDefaults.includes(tag) ? "selected" : ""}`}
                onClick={() => toggleDefaultTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="custom-tag-input">
            <input
              type="text"
              placeholder="Add custom tag"
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomTag()}
              aria-label="Custom tag input"
            />
            <button type="button" onClick={addCustomTag} disabled={!customTag.trim()}>
              Add
            </button>
          </div>

          <div className="popup-actions">
            <button type="button" onClick={addSelectedTags} disabled={selectedDefaults.length === 0}>
              Add Selected
            </button>
          </div>
        </div>
      )}

    </>
  );
}
