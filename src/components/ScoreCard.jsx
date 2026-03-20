import { PlayerColumn } from './PlayerColumn';
import '../styles/score-card.css';

export const ScoreCard = ({
  players,
  onPlayerNameChange,
  onResourceChange,
  onAddPlayer,
  onDeletePlayer,
  onSave,
  hasChanges,
  isSaving,
}) => {
  // Filter players that have a name
  const existingPlayers = players.filter(p => p.name.trim());

  // Show 4 columns (some may be placeholders)
  const displayPlayers = [];
  for (let i = 0; i < 4; i++) {
    displayPlayers.push({
      player: players[i] || null,
      isPlaceholder: !players[i] || !players[i].name.trim()
    });
  }

  return (
    <div className="score-card">
      <div className="players-grid-fixed">
        {displayPlayers.map((item, idx) => (
          <PlayerColumn
            key={idx}
            player={item.player || { id: `empty-${idx}`, name: '', resources: {}, animalPoints: Array.from({ length: 8 }, () => 0) }}
            onPlayerNameChange={onPlayerNameChange}
            onResourceChange={onResourceChange}
            onDelete={item.isPlaceholder ? null : onDeletePlayer}
            isPlaceholder={item.isPlaceholder}
          />
        ))}
      </div>

      {hasChanges && (
        <div className="save-bar">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-save-large"
          >
            {isSaving ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      )}
    </div>
  );
};
