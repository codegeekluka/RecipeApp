import React from 'react';
import '../../styles/planner/TagFilter.css';

const TagFilter = ({ tags, selectedTags, onTagToggle }) => {
  return (
    <div className="tag-filter">
      {tags.map(tag => (
        <button
          key={tag}
          className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
          onClick={() => onTagToggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagFilter;
