import React from 'react';

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search modules..."
      />
    </div>
  );
}

export default SearchBar;
