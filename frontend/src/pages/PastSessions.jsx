import { useEffect, useState } from 'react';

export default function PastSessions({ gameId }) {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchSessions = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const game = data.games.find((g) => g.id.toString() === gameId);
      if (!game) return setError('Game not found');

      const inactiveSessions = game.oldSessions || [];
      setSessions(inactiveSessions);
    } catch {
      setError('Failed to fetch past sessions');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [gameId]);

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Past Sessions for Game {gameId}</h1>
      {sessions.length === 0 ? (
        <p className="text-gray-600">No past sessions found.</p>
      ) : (
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Session ID</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((sessionId, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{sessionId}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => window.location.hash = `/session/${sessionId}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View Results
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
