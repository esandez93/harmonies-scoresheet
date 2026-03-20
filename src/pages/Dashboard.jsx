import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/dashboard.css';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    navigate('/game/new');
  };

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Harmonies Scoresheet</h1>
        <button onClick={handleSignOut} className="btn-secondary">
          Sign Out
        </button>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-top">
          <h2>Your Games</h2>
          <button onClick={handleNewGame} className="btn-primary">
            + New Game
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading games...</div>
        ) : games.length === 0 ? (
          <div className="empty-state">
            <p>No games yet. Create your first game to get started!</p>
          </div>
        ) : (
          <div className="games-grid">
            {games.map((game) => (
              <div
                key={game.id}
                className="game-card"
                onClick={() => handleGameClick(game.id)}
              >
                <h3>{game.name || 'Unnamed Game'}</h3>
                <p className="game-date">
                  {new Date(game.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
