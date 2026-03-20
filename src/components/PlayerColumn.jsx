import React, { useRef } from 'react';
import { ResourceScore } from './ResourceScore';
import { OtherPointsField } from './OtherPointsField';

const RESOURCES = [
  { color: 'green', label: 'Green' },
  { color: 'grey', label: 'Grey' },
  { color: 'yellow', label: 'yellow' },
  { color: 'red', label: 'Red' },
  { color: 'blue', label: 'Blue' },
];

export const PlayerColumn = ({
  player,
  onPlayerNameChange,
  onResourceChange,
  onDelete,
  isPlaceholder = false
}) => {
  const playerNameInputRef = useRef(null);
  const isPlayerNameEmpty = !player.name.trim();

  // Calculate totals
  const resourcesTotal = RESOURCES.reduce(
    (sum, res) => sum + (player.resources[res.color] || 0),
    0
  );

  // Sum all 8 animal points fields
  const animalPointsArray = Array.isArray(player.animalPoints)
    ? player.animalPoints
    : [player.animalPoints || 0, 0, 0, 0, 0, 0, 0, 0];

  const animalPointsTotal = animalPointsArray.reduce((sum, val) => sum + (val || 0), 0);
  const grandTotal = resourcesTotal + animalPointsTotal;

  const handleColumnClick = () => {
    if (isPlayerNameEmpty && playerNameInputRef.current) {
      playerNameInputRef.current.focus();
    }
  };

  return (
    <div
      className={`player-column ${isPlaceholder ? 'placeholder' : ''} ${isPlayerNameEmpty ? 'empty-name' : ''}`}
      onClick={handleColumnClick}
    >
      <div className="player-header">
        <input
          ref={playerNameInputRef}
          type="text"
          value={player.name}
          onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
          className="player-name-input"
          placeholder="Player"
        />
        {onDelete && !isPlaceholder && (
          <button
            onClick={() => onDelete(player.id)}
            className="btn-delete-player"
            title="Remove player"
          >
            ×
          </button>
        )}
      </div>

      <div className="scoresheet-body">
        {/* Two-column layout: Resources | Animal Points */}
        <div className="two-columns-container">
          {/* Left Column: Resources */}
          <div className="resources-section">
            {RESOURCES.map((resource) => (
              <ResourceScore
                key={resource.color}
                color={resource.color}
                value={player.resources[resource.color] || 0}
                onChange={(value) =>
                  onResourceChange(player.id, 'resource', resource.color, value)
                }
                disabled={isPlayerNameEmpty}
                onClick={handleColumnClick}
              />
            ))}
          </div>

          {/* Right Column: Animal Points (8 fields) */}
          <div className="animal-points-section">
            {Array.from({ length: 8 }).map((_, idx) => (
              <OtherPointsField
                key={idx}
                index={idx}
                value={animalPointsArray[idx] || 0}
                onChange={(value) =>
                  onResourceChange(player.id, 'animalPoints', idx, value)
                }
                disabled={isPlayerNameEmpty}
                onClick={handleColumnClick}
              />
            ))}
          </div>
        </div>

        {/* Totals Section - 2 rows */}
        <div className="totals-section">
          {/* Row 1: Resources Total + Animal Points Total */}
          <div className="totals-row-1">
            <div className="total-field">
              <div className="total-value">{resourcesTotal}</div>
            </div>
            <div>+</div>
            <div className="total-field">
              <div className="total-value">{animalPointsTotal}</div>
            </div>
          </div>

          {/* Row 2: Grand Total */}
          <div className="totals-row-2">
            <div className="grand-total-operator-sign">=</div>
            <div className="grand-total-field">
              <div className="grand-total-value">{grandTotal}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
