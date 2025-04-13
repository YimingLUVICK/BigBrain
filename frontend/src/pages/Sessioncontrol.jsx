// Sessioncontrol.jsx
import { useEffect, useState } from 'react';

export default function Sessioncontrol({ sessionId }) {
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/session/${sessionId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data.results);
    } catch (err) {
      setError('Failed to fetch session status');
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/session/${sessionId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError('Failed to fetch results');
    }
  };

  const handleAdvance = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutationType: 'ADVANCE' }),
      });
      await fetchStatus();
    } catch (err) {
      setError('Failed to advance');
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutationType: 'END' }),
      });
      await fetchStatus();
      await fetchResults();
    } catch (err) {
      setError('Failed to stop game');
    }
  };

  useEffect(() => {
    fetchStatus();
  
    const map = JSON.parse(localStorage.getItem('session_game_map') || '{}');
    if (sessionId in map) {
      setGameId(map[sessionId]);
    }
  }, [sessionId]);

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!status) return <div className="p-6">Loading session...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Session Control: {sessionId}</h1>
      <p>Status: {status.active ? '🟢 Active' : '🔴 Finished'}</p>
      <p>Current position: {status.position}</p>
      <p>Players: {status.players.join(', ')}</p>

      {status.active && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleAdvance}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Advance
          </button>
          <button
            onClick={handleStop}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop Game
          </button>
        </div>
      )}

      {!status.active && results && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Session Results</h2>
          <table className="table-auto w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((player, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.answers.filter(a => a.correct).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* 图表与分析后续添加 */}
        </div>
      )}
    </div>
  );
}
