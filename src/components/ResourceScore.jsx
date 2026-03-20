import React from 'react';

export const ResourceScore = ({
  color,
  value,
  onChange,
  disabled = false,
  onClick
}) => {
  const handleChange = (e) => {
    if (disabled) return;
    // Remove non-numeric characters and leading zeros
    const cleaned = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const numValue = Math.max(0, parseInt(cleaned, 10) || 0);
    onChange(numValue);
  };

  const handleClick = (e) => {
    if (disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div className="resource-row">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        className={`resource-input resource-${color} ${disabled ? 'disabled' : ''}`}
        title={`Enter ${color} resources`}
      />
    </div>
  );
};
