import React from 'react';
import './AccessLevelSelect.css';

function AccessLevelSelect({ value, onChange, disabled }) {
  const accessLevels = [
    { name: 'Guest', value: '10' },
    { name: 'Reporter', value: '20' },
    { name: 'Developer', value: '30' },
    { name: 'Maintainer', value: '40' },
    { name: 'Owner', value: '50' },
  ];

  return (
    <div>
      <label>Access Level:</label>
      <p className="help-text">Select the access level for the members.</p>
      <select
        name="accessLevel"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {accessLevels.map(level => (
          <option key={level.value} value={level.value}>
            {level.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AccessLevelSelect;