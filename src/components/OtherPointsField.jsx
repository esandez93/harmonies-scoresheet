import React from 'react';

export const OtherPointsField = ({
  index,
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
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      onClick={handleClick}
      className={`animal-point-input ${disabled ? 'disabled' : ''}`}
      title={`Animal point ${index + 1}`}
    />
  );
};
