// Dashboard.jsx
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState('');
  const [activeSessions, setActiveSessions] = useState({});
  const [activeSessionPopupIds, setActiveSessionPopupIds] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  const fetchGames = async () => {
    try {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGames(data.games || []);

      const active = {};
      for (const game of data.games) {
        if (game.active) {
          active[game.id] = game.active;
        }
      }
      setActiveSessions(active);
    } catch {
      setError('Failed to fetch games');
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.hash = '/login';
    } else {
      fetchGames();
      const interval = setInterval(fetchGames, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleCreate = async () => {
    if (!newGameName.trim()) return;
    try {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const newId = Date.now();
      const updatedGames = [
        ...data.games,
        {
          id: newId,
          name: newGameName,
          owner: email,
          questions: [],
        },
      ];

      const updateRes = await fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Failed to update games');
      }

      setNewGameName('');
      await fetchGames();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5005/admin/games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const updatedGames = data.games.filter((game) => game.id !== id);

      const updateRes = await fetch(`http://localhost:5005/admin/games`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` },
        body: JSON.stringify({ games: updatedGames }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Failed to delete game');
      }

      await fetchGames();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartGame = async (gameId) => {
    try {
      const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mutationType: 'START' }),
      });

      const data = await res.json();
      const sessionId = data.data.sessionId;

      localStorage.setItem('session_game_map', JSON.stringify({
        ...JSON.parse(localStorage.getItem('session_game_map') || '{}'),
        [sessionId]: gameId
      }));

      setActiveSessionPopupIds((prev) => [...prev, gameId]);
      await fetchGames();
    } catch {
      setError('Failed to start session');
    }
  };

  const handleStopGame = async (gameId) => {
    try {
      await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mutationType: 'END' }),
      });

      setActiveSessionPopupIds((prev) => prev.filter((id) => id !== gameId));
      await fetchGames();
    } catch {
      setError('Failed to stop session');
    }
  };

  const validateGameFile = (game) => {
    if (!game.name || !Array.isArray(game.questions)) return false;
    return game.questions.every(q =>
      q.text && Array.isArray(q.answers) &&
      Array.isArray(q.correctAnswers) &&
      ['single', 'multiple', 'judgement'].includes(q.type) &&
      typeof q.duration === 'number' &&
      typeof q.points === 'number'
    );
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);
        if (!validateGameFile(content)) throw new Error('Invalid game file format');
        const res = await fetch('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const newId = Date.now();
        const updatedGames = [
          ...data.games,
          { ...content, id: newId, owner: email }
        ];
        await fetch('http://localhost:5005/admin/games', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ games: updatedGames }),
        });
        setUploadFile(null);
        await fetchGames();
      } catch (err) {
        setError(err.message || 'Failed to upload game');
      }
    };
    reader.readAsText(uploadFile);
  };

  // === Render: Main Dashboard ===
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* === Header === */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">My Games</h1>
        <button
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          onClick={() => {
            localStorage.removeItem('token');
            window.location.hash = '/login';
          }}
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* === Game Creation & Upload Section === */}
      <div className="mb-6 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">

        {/* Create Empty Game */}
        <div className="flex space-x-2 items-center">
          <input
            className="p-2 border rounded w-64"
            type="text"
            placeholder="New game name"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Create Empty Game
          </button>
        </div>

        {/* Upload Game File */}
        <div className="flex space-x-2 items-center">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="p-2 border rounded"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Upload Game File
          </button>
        </div>
      </div>

      {/* === Game Cards Section === */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const questionCount = game.questions?.length || 0;
          const totalTime = game.questions?.reduce((s, q) => s + (q.time || 0), 0);
          const sessionId = activeSessions[game.id];
          const showStartPopup = activeSessionPopupIds.includes(game.id);

          return (
            <div
              key={game.id}
              className="relative bg-white shadow rounded p-4 border hover:border-blue-500 transition duration-150"
            >
              {/* === Game Info (clickable) === */}
              <div
                onClick={() => (window.location.hash = `/game/${game.id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-xl font-bold">{game.name}</h2>
                <p className="text-sm text-gray-600">
                  {questionCount} questions | {totalTime} sec
                </p>
                <p className="text-sm mt-1">Created by: {game.owner}</p>
                <p className="text-sm">
                  Status: {sessionId ? '🟢 Active' : '⚪️ Inactive'}
                </p>
                {game.thumbnail ? (
                  <img
                    src={game.thumbnail}
                    alt="Thumbnail"
                    className="mt-2 h-32 w-full object-cover rounded"
                  />
                ) : (
                  <div className="mt-2 h-32 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                    No thumbnail
                  </div>
                )}
              </div>

              {/* === Start/Stop Session Buttons === */}
              {!sessionId ? (
                <button
                  onClick={() => handleStartGame(game.id)}
                  className="mt-3 w-full bg-purple-500 hover:bg-purple-600 text-white py-1 rounded text-sm"
                >
                  Start Game
                </button>
              ) : (
                <button
                  onClick={() => handleStopGame(game.id)}
                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded text-sm"
                >
                  Stop Game
                </button>
              )}

              {/* === Edit & Past Sessions Buttons === */}
              <div className="flex space-x-2 mt-2">
                <button
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-white py-1 rounded text-sm"
                  onClick={() => window.location.hash = `/game/${game.id}`}
                >
                  Edit
                </button>
                <button
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-1 rounded text-sm"
                  onClick={() => window.location.hash = `/game/${game.id}/sessions`}
                >
                  Past Sessions
                </button>
              </div>

              {/* === Delete Game Button === */}
              <button
                className="mt-2 w-full bg-red-400 hover:bg-red-500 text-white py-1 rounded text-sm"
                onClick={() => handleDelete(game.id)}
              >
                Delete Game
              </button>

              {/* === Popup: Session Links === */}
              {showStartPopup && sessionId && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-10 border rounded">
                  <h2 className="text-xl font-bold mb-2">Session Started</h2>
                  <p className="text-sm text-gray-700 mb-2">ID: {sessionId}</p>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-1"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/play/${sessionId}`)}
                  >
                    Join Link
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-1"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/session/${sessionId}`)}
                  >
                    Control Link
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}