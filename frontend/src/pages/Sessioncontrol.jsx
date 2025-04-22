// Sessioncontrol.jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Sessioncontrol({ sessionId }) {
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [countdown, setCountdown] = useState(null);
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

  useEffect(() => {
    if (!status || !status.active || status.position >= 0) return;
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!status?.active) {
      fetchResults();
    }
  }, [status?.active]);

  const topPlayers = results ? [...results]
    .sort((a, b) => b.answers.filter(ans => ans.correct).length - a.answers.filter(ans => ans.correct).length)
    .slice(0, 5) : [];

  const questionStats = () => {
    if (!results) return [];
    const totalPlayers = results.length;
    const numQuestions = results[0]?.answers.length || 0;

    const correctCounts = Array(numQuestions).fill(0);
    const totalTimes = Array(numQuestions).fill(0);

    results.forEach(player => {
      player.answers.forEach((ans, idx) => {
        if (ans.correct) correctCounts[idx]++;
        if (ans.answeredAt && ans.questionStartedAt) {
          const time = (new Date(ans.answeredAt) - new Date(ans.questionStartedAt)) / 1000;
          totalTimes[idx] += time;
        }
      });
    });

    return correctCounts.map((count, idx) => ({
      question: `Q${idx + 1}`,
      percentageCorrect: ((count / totalPlayers) * 100).toFixed(1),
      avgTime: (totalTimes[idx] / totalPlayers).toFixed(1)
    }));
  };

  const stats = questionStats();

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!status) return <div className="p-6">Loading session...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow relative">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Session Control: {sessionId}</h1>
        <button
          onClick={() => { window.location.hash = '#/dashboard'; }}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded text-sm"
        >
          Back to Dashboard
        </button>
      </div>

      <p>Status: {status.active ? '🟢 Active' : '🔴 Finished'}</p>
      <p>Current position: {status.position}</p>
      <p>Time remaining: {countdown !== null ? `${countdown}s` : '-'}</p>
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
          <h2 className="text-xl font-bold mb-2">Top 5 Players</h2>
          <table className="table-auto w-full border mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((player, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.answers.filter(ans => ans.correct).length}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-xl font-bold mb-4">Percentage Correct per Question</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <XAxis dataKey="question" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentageCorrect" />
            </BarChart>
          </ResponsiveContainer>

          <h2 className="text-xl font-bold mb-4 mt-8">Average Response Time per Question</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgTime" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
