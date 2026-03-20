# UI Redesign - Scoresheet Component Architecture

## Overview

The Harmonies Scoresheet app has been redesigned with a pen-and-paper scoresheet look, using proper component-driven architecture for maintainability and reusability.

## Component Structure

### ScoreCard (`src/components/ScoreCard.jsx`)
**Main container component** for the entire scoring interface.

**Props:**
- `players` - Array of player objects
- `onPlayerNameChange` - Callback to update player names
- `onResourceChange` - Callback to update resource/score values
- `onAddPlayer` - Callback to add new player
- `onDeletePlayer` - Callback to remove player
- `onSave` - Callback to save game to database
- `hasChanges` - Boolean indicating unsaved changes
- `isSaving` - Boolean indicating save in progress

**Features:**
- Responsive grid layout (1-6 players per row depending on screen size)
- Save button appears only when changes exist
- Add player button (max 6 players)

### PlayerColumn (`src/components/PlayerColumn.jsx`)
**Single player's scoresheet column** with all their data.

**Props:**
- `player` - Player object with name, resources, and score
- `onPlayerNameChange` - Callback for name updates
- `onResourceChange` - Callback for resource/score updates
- `onDelete` - Callback to delete player

**Features:**
- Editable player name input
- Delete button (×)
- Resource score grid (6 colors)
- Total score display

### ResourceScore (`src/components/ResourceScore.jsx`)
**Single resource scoring component** with color circle and input.

**Props:**
- `color` - Resource type (green, white, blue, yellow, red, cyan)
- `label` - Display name
- `value` - Current score
- `onChange` - Callback for value updates

**Features:**
- Colored circle representing game resource
- Numeric input field
- Instant updates (no DB save yet)

## Data Structure

### Player Object
```javascript
{
  id: "temp-1234",
  name: "Alice",
  resources: {
    green: 2,
    white: 1,
    blue: 3,
    yellow: 2,
    red: 1,
    cyan: 2
  },
  score: 11
}
```

### Database Schema
```sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  resource_green INTEGER DEFAULT 0,
  resource_white INTEGER DEFAULT 0,
  resource_blue INTEGER DEFAULT 0,
  resource_yellow INTEGER DEFAULT 0,
  resource_red INTEGER DEFAULT 0,
  resource_cyan INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Styling

### Main CSS Files
- **`score-card.css`** - ScoreCard and PlayerColumn styling
  - Wooden/cardboard background
  - Gradient colors
  - Mobile responsiveness
  - Resource circle styling
  - Input field styling

- **`game-detail.css`** - Game page layout
  - Header styling
  - Content container
  - Global game-level styles

## Interaction Flow

### Local State Changes
1. User types in an input field
2. onChange handler triggers
3. Player state updates instantly in React
4. `hasChanges` flag set to true
5. **No database call yet** - instant feedback
6. Screen does NOT reload

### Saving to Database
1. User clicks "Save Game" button
2. All players filtered (removes empty ones)
3. New `game_players` table is cleared
4. All current players inserted as a batch
5. `hasChanges` set to false
6. Button disappears
7. Single database write = smooth UX

## Colors & Resources

The six resources in Harmonies are represented by colors:

| Color | Resource | RGB |
|-------|----------|-----|
| Green | Sprout | `#84cc16` → `#65a30d` |
| White | Light | `#ffffff` → `#f3f4f6` |
| Blue | Water | `#3b82f6` → `#1d4ed8` |
| Yellow | Sun | `#fbbf24` → `#d97706` |
| Red | Fire | `#ef4444` → `#b91c1c` |
| Cyan | Air | `#06b6d4` → `#0891b2` |

## Responsive Design

### Desktop (1200px+)
- Up to 6 players per row
- Full-size player columns
- Optimal spacing

### Tablet (768px - 1199px)
- Up to 4 players per row
- Slightly reduced sizing
- Touch-friendly inputs

### Mobile (480px - 767px)
- Up to 2 players per row
- Compact layout
- Larger tap targets

### Small Mobile (<480px)
- 1 player per row
- Minimal padding
- Full-width columns

## Features

✅ **Fully Editable** - All fields (names, scores, resources) are editable
✅ **Instant Feedback** - No reload on input
✅ **Smart Save** - Single batch operation to DB
✅ **Mobile First** - Works seamlessly on phones
✅ **Pen & Paper** - Mimics physical scoresheet design
✅ **Flexible Players** - 1-6 players per game
✅ **Clean Components** - Easy to maintain and extend

## Database Requirements

Before using the app, create the new `game_players` table using the SQL from:
- `README.md` (complete setup section)
- `.github/SUPABASE_SETUP.md` (Supabase setup guide)

If you're migrating from the old `scores` table, the app will gracefully start with a blank player and you can manually migrate data later.

## Future Enhancements

Potential additions while maintaining component structure:

- Resource trading/selection phase
- Harvest phase automation
- Undo/redo functionality
- Game history and statistics
- Leaderboards
- Export game results
- Dark mode
- Keyboard shortcuts

All can be added without modifying the core component structure.
