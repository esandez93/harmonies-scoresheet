import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/new-game.css';

export const NewGame = () => {
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Fetch user's username (or use email as fallback)
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id);

      // Use existing username or default to email
      let username = user.email.split('@')[0];
      if (!profileError && userProfiles && userProfiles.length > 0) {
        username = userProfiles[0].username;
      }

      // Create the game
      const { data: gameDataArray, error: gameError } = await supabase
        .from('games')
        .insert([
          {
            name: gameName || 'Harmonies Game',
            user_id: user.id,
          },
        ])
        .select();

      if (gameError) throw gameError;
      if (!gameDataArray || gameDataArray.length === 0) {
        throw new Error('Failed to create game');
      }

      const gameData = gameDataArray[0];

      // Insert the creator as the first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert([
          {
            game_id: gameData.id,
            player_name: username,
            user_id: user.id,
          },
        ]);

      if (playerError) throw playerError;

      navigate(`/game/${gameData.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="new-game-container">
      <div className="new-game-box">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
        <h1>Create New Game</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="game-name">Game Name (optional)</label>
            <input
              id="game-name"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g., Friday Night Game"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
};
