import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ScoreCard } from '../components/ScoreCard';
import '../styles/game-detail.css';

const RESOURCES = ['green', 'grey', 'yellow', 'red', 'blue'];
const ANIMAL_POINTS_COUNT = 8;

// Initialize a new player with all resources and animal points fields
const createNewPlayer = (name = '') => ({
  id: `temp-${Date.now()}-${Math.random()}`,
  name,
  resources: RESOURCES.reduce((acc, res) => ({ ...acc, [res]: 0 }), {}),
  animalPoints: Array.from({ length: ANIMAL_POINTS_COUNT }, () => 0),
});

// Convert player from DB format to local format
const playerFromDB = (dbScore) => {
  // Read animal points from individual columns
  const animalPoints = Array.from({ length: ANIMAL_POINTS_COUNT }, (_, i) =>
    dbScore[`animal_point_${i + 1}`] || 0
  );

  return {
    id: dbScore.id,
    name: dbScore.player_name,
    resources: RESOURCES.reduce((acc, res) => ({
      ...acc,
      [res]: dbScore[`resource_${res}`] || 0,
    }), {}),
    animalPoints,
  };
};

// Convert player from local format to DB format
const playerToDB = (gameId, player) => {
  const baseData = {
    game_id: gameId,
    player_name: player.name,
    ...RESOURCES.reduce((acc, res) => ({
      ...acc,
      [`resource_${res}`]: player.resources[res] || 0,
    }), {}),
  };

  // Add animal points from array to individual columns
  const animalPointsArray = Array.isArray(player.animalPoints)
    ? player.animalPoints
    : Array.from({ length: ANIMAL_POINTS_COUNT }, () => 0);

  animalPointsArray.forEach((value, i) => {
    baseData[`animal_point_${i + 1}`] = value || 0;
  });

  return baseData;
};

export const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([
    createNewPlayer(),
    createNewPlayer(),
    createNewPlayer(),
    createNewPlayer(),
  ]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      // Try to fetch from new game_players table first
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('player_name');

      if (!playerError && playerData) {
        const loadedPlayers = playerData.map((p) => playerFromDB(p));
        // Ensure at least 4 players shown
        while (loadedPlayers.length < 4) {
          loadedPlayers.push(createNewPlayer());
        }
        setPlayers(loadedPlayers);
      } else {
        // Table doesn't exist or no data - start with 4 blank players
        setPlayers([
          createNewPlayer(),
          createNewPlayer(),
          createNewPlayer(),
          createNewPlayer(),
        ]);
      }

      setHasChanges(false);
    } catch (err) {
      // On error, just start with 4 blank players
      setPlayers([
        createNewPlayer(),
        createNewPlayer(),
        createNewPlayer(),
        createNewPlayer(),
      ]);
      if (!err.message.includes('does not exist')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerNameChange = (playerId, newName) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, name: newName } : p
      )
    );
    setHasChanges(true);
  };

  const handleResourceChange = (playerId, type, colorOrIndex, value) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;

        if (type === 'resource') {
          return {
            ...p,
            resources: { ...p.resources, [colorOrIndex]: value },
          };
        } else if (type === 'animalPoints') {
          const newAnimalPoints = Array.isArray(p.animalPoints)
            ? [...p.animalPoints]
            : Array.from({ length: ANIMAL_POINTS_COUNT }, () => 0);
          newAnimalPoints[colorOrIndex] = value;
          return {
            ...p,
            animalPoints: newAnimalPoints,
          };
        }
        return p;
      })
    );
    setHasChanges(true);
  };

  const handleAddPlayer = () => {
    setPlayers((prev) => [...prev, createNewPlayer()]);
    setHasChanges(true);
  };

  const handleDeletePlayer = (playerId) => {
    setPlayers((prev) =>
      prev.filter((p) => p.id !== playerId).length >= 4
        ? prev.filter((p) => p.id !== playerId)
        : [
            ...prev.filter((p) => p.id !== playerId),
            createNewPlayer(),
          ]
    );
    setHasChanges(true);
  };

  const handleSaveGame = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Verify the game exists and belongs to the user
      const { data: gameCheck, error: gameCheckError } = await supabase
        .from('games')
        .select('id, user_id')
        .eq('id', gameId)
        .single();

      if (gameCheckError || !gameCheck) {
        throw new Error('Game not found or you do not have permission to access it');
      }

      // Delete all existing player data
      const { error: deleteError } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId);

      if (deleteError) {
        throw new Error(`Failed to delete existing players: ${deleteError.message}`);
      }

      // Filter out empty players (only those with a name)
      const playersToSave = players.filter((p) => p.name.trim());

      if (playersToSave.length > 0) {
        const dataToInsert = playersToSave.map((p) => playerToDB(gameId, p));

        const { error: insertError } = await supabase
          .from('game_players')
          .insert(dataToInsert);

        if (insertError) {
          throw new Error(`Failed to save players: ${insertError.message}`);
        }
      }

      setHasChanges(false);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-full">Loading game...</div>;
  }

  if (!game) {
    return (
      <div className="error-full">
        <p>Game not found</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="game-detail">
      <header className="game-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
        <h1>{game.name || 'Unnamed Game'}</h1>
      </header>

      <main className="game-content-scoresheet">
        {error && <div className="error-message">{error}</div>}

        <ScoreCard
          players={players}
          onPlayerNameChange={handlePlayerNameChange}
          onResourceChange={handleResourceChange}
          onAddPlayer={handleAddPlayer}
          onDeletePlayer={handleDeletePlayer}
          onSave={handleSaveGame}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      </main>
    </div>
  );
};
