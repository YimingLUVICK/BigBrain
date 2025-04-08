import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGameName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create game');
      }

      setNewGameName('');
      await fetchGames(); // 重新加载
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">My Games</h1>

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
              className="bg-white shadow rounded p-4 border hover:border-blue-500"
              onClick={() => (window.location.hash = `/game/${game.id}`)}
              style={{ cursor: 'pointer' }}
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
          );
        })}
      </div>
    </div>
  );
}
