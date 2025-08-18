import '../../styles/ui/AddTags.css'
export default function TagsPills({ tags, onRemoveTag, editMode = false }) {
    return (
      <div className="tags-topright">
        {tags.map(tag => (
          <div key={tag} className="tag-pill">
            {editMode && (
              <button
                className="tag-remove"
                onClick={() => onRemoveTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            )}
            <p className="tag-text">{tag}</p>
          </div>
        ))}
      </div>
    );
  }
  