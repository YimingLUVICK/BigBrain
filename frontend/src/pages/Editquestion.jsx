import { useEffect, useState } from 'react';

export default function Editquestion({ gameId, questionId }) {
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // === Step 1: Fetch the game and specific question ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const game = data.games.find((g) => g.id.toString() === gameId);
        if (!game) return setError('Game not found');
        const q = game.questions?.[parseInt(questionId)];
        if (!q) return setError('Question not found');

        setGame(game);
        setQuestion({ ...q }); // clone to avoid direct mutation
      } catch (err) {
        setError('Failed to fetch game data');
      }
    };
    fetchData();
  }, [gameId, questionId]);

  // === Step 2: Save updated question ===
  const save = async () => {
    try {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const updatedGames = data.games.map((g) => {
        if (g.id.toString() !== gameId) return g;
        const updatedQuestions = [...g.questions];
        updatedQuestions[parseInt(questionId)] = question;
        return { ...g, questions: updatedQuestions };
      });

      await fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      });

      window.location.hash = `/game/${gameId}`;
    } catch (err) {
      setError('Failed to save question');
    }
  };

  const updateAnswer = (idx, field, value) => {
    const updated = [...(question.answers || [])];
    updated[idx][field] = value;
    setQuestion({ ...question, answers: updated });
  };

  const addAnswer = () => {
    if ((question.answers || []).length >= 6) return;
    setQuestion({
      ...question,
      answers: [...(question.answers || []), { text: '', correct: false }],
    });
  };

  const removeAnswer = (idx) => {
    const updated = [...(question.answers || [])];
    updated.splice(idx, 1);
    setQuestion({ ...question, answers: updated });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestion({ ...question, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!question) return <div className="p-6">Loading question...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Question</h1>

      {/* Question Text */}
      <label className="block mb-2 font-semibold">Question</label>
      <input
        type="text"
        className="w-full p-2 border rounded mb-4"
        value={question.text || ''}
        onChange={(e) => setQuestion({ ...question, text: e.target.value })}
      />

      {/* Type */}
      <label className="block mb-2 font-semibold">Question Type</label>
      <select
        className="w-full p-2 border rounded mb-4"
        value={question.type || 'single'}
        onChange={(e) => setQuestion({ ...question, type: e.target.value })}
      >
        <option value="single">Single Choice</option>
        <option value="multiple">Multiple Choice</option>
        <option value="judgement">Judgement</option>
      </select>

      {/* Time + Points */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block font-semibold">Time Limit (sec)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={question.time || 30}
            onChange={(e) => setQuestion({ ...question, time: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex-1">
          <label className="block font-semibold">Points</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={question.points || 0}
            onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) })}
          />
        </div>
      </div>

      