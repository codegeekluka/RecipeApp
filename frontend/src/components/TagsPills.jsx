export default function TagsPills({ tags, onRemoveTag }) {
    return (
      <div className="tags-topright">
        {tags.map(tag => (
          <div key={tag} className="tag-pill">
            {tag}
            <button
              className="tag-remove"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }
  