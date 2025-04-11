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

      {/* YouTube Link */}
      <label className="block mb-2 font-semibold">YouTube Video URL (optional)</label>
      <input
        type="text"
        className="w-full p-2 border rounded mb-4"
        value={question.video || ''}
        onChange={(e) => setQuestion({ ...question, video: e.target.value })}
      />

      {/* Image Upload */}
      <label className="block mb-2 font-semibold">Upload Image (optional)</label>
      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={handleFileUpload}
      />
      {question.image && (
        <img src={question.image} alt="Question" className="mb-4 rounded w-full h-48 object-cover" />
      )}

      {/* Answers */}
      <label className="block mb-2 font-semibold">Answers (2 to 6)</label>
      {(question.answers || []).map((ans, idx) => (
        <div key={idx} className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={ans.text}
            onChange={(e) => updateAnswer(idx, 'text', e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder={`Answer ${idx + 1}`}
          />
          {question.type === 'single' ? (
            <input
              type="radio"
              name="correctSingle"
              checked={ans.correct}
              onChange={() =>
                setQuestion({
                  ...question,
                  answers: question.answers.map((a, i) => ({
                    ...a,
                    correct: i === idx,
                  })),
                })
              }
            />
          ) : (
            <input
              type="checkbox"
              checked={ans.correct}
              onChange={(e) => updateAnswer(idx, 'correct', e.target.checked)}
            />
          )}
          <button
            onClick={() => removeAnswer(idx)}
            className="text-sm bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}
      {question.answers?.length < 6 && (
        <button
          onClick={addAnswer}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4"
        >
          Add Answer
        </button>
      )}

      {/* Save Button */}
      <button
        onClick={save}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        Save and Return
      </button>
    </div>
  );
}
