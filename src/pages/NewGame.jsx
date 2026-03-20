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
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            name: gameName || 'Harmonies Game',
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      navigate(`/game/${data.id}`);
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
