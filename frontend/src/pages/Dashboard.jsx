import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState('');

  const [activeSessions, setActiveSessions] = useState({}); // gameId → sessionId 映射
  const [showSessionPopup, setShowSessionPopup] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState('');

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  const fetchGames = async () => {
    try {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGames(data.games || []);
    } catch (err) {
      setError('Failed to fetch games');
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.hash = '/login';
    } else {
      fetchGames();
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
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
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

      <div className="mb-6 flex space-x-2">
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
          Create Game
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const totalTime =
            game.questions?.reduce((sum, q) => sum + (q.time || 0), 0) || 0;
          const questionCount = game.questions?.length || 0;
          const active = game.active ? '🟢 Active' : '⚪️ Inactive';

          return (
            <div
              key={game.id}
              className="bg-white shadow rounded p-4 border hover:border-blue-500 transition duration-150"
            >
              <div
                onClick={() => (window.location.hash = `/game/${game.id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-xl font-bold">{game.name}</h2>
                <p className="text-sm text-gray-600">
                  {questionCount} questions | {totalTime} sec
                </p>
                <p className="text-sm mt-1">Created by: {game.owner}</p>
                <p className="text-sm">Status: {active}</p>

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
              <button
                className="mt-3 w-full bg-red-400 hover:bg-red-500 text-white py-1 rounded text-sm"
                onClick={() => handleDelete(game.id)}
              >
                Delete Game
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}