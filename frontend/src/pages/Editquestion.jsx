import { useEffect, useState } from 'react';

export default function Editquestion({ gameId, questionId }) {
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // === Step 1: Fetch game and question ===
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

        const initialAnswers = q.answers?.map(a => a.answer || '') || [];
        setGame(game);
        setQuestion({
          ...q,
          text: q.text || '',
          type: q.type || 'single',
          answers: initialAnswers,
          correctAnswers: q.correctAnswers || [],
          duration: q.duration || 30,
        });
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

        const formattedQuestion = {
          duration: question.duration,
          correctAnswers: question.correctAnswers,
          answers: question.answers.map(a => ({ answer: a })),
          text: question.text,
          type: question.type,  // ⚠️ 额外字段，用于前端识别用途
        };

        const updatedQuestions = [...g.questions];
        updatedQuestions[parseInt(questionId)] = formattedQuestion;
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

  const updateAnswer = (idx, value) => {
    const updated = [...question.answers];
    updated[idx] = value;
    setQuestion({ ...question, answers: updated });
  };

  const toggleCorrectAnswer = (value) => {
    if (question.type === 'single') {
      setQuestion({
        ...question,
        correctAnswers: [value],
      });
    } else {
      const current = question.correctAnswers || [];
      if (current.includes(value)) {
        setQuestion({
          ...question,
          correctAnswers: current.filter(ans => ans !== value),
        });
      } else {
        setQuestion({
          ...question,
          correctAnswers: [...current, value],
        });
      }
    }
  };

  const addAnswer = () => {
    if ((question.answers || []).length >= 6) return;
    setQuestion({
      ...question,
      answers: [...question.answers, '']
    });
  };

  const removeAnswer = (idx) => {
    const removed = question.answers[idx];
    const updated = [...question.answers];
    updated.splice(idx, 1);
    const updatedCorrect = (question.correctAnswers || []).filter(ans => ans !== removed);
    setQuestion({ ...question, answers: updated, correctAnswers: updatedCorrect });
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!question) return <div className="p-6">Loading question...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Question</h1>

      {/* Question Text */}
      <label className="block mb-2 font-semibold">Question Text</label>
      <input
        type="text"
        className="w-full p-2 border rounded mb-4"
        value={question.text || ''}
        onChange={(e) => setQuestion({ ...question, text: e.target.value })}
      />

      {/* Question Type */}
      <label className="block mb-2 font-semibold">Question Type</label>
      <select
        className="w-full p-2 border rounded mb-4"
        value={question.type}
        onChange={(e) => {
          const newType = e.target.value;
          const updated = { ...question, type: newType };
          // 强制处理 correctAnswers 在类型转换时保持一致性
          if (newType === 'single' && question.correctAnswers.length > 1) {
            updated.correctAnswers = question.correctAnswers.slice(0, 1);
          }
          setQuestion(updated);
        }}
      >
        <option value="single">Single Choice</option>
        <option value="multiple">Multiple Choice</option>
        <option value="judgement">Judgement</option>
      </select>

      {/* Time */}
      <label className="block font-semibold">Time Limit (seconds)</label>
      <input
        type="number"
        className="w-full p-2 border rounded mb-4"
        value={question.duration}
        onChange={(e) => setQuestion({ ...question, duration: parseInt(e.target.value) })}
      />

      {/* Answers */}
      <label className="block font-semibold mb-2">Answers (from 2 to 6)</label>
      {question.answers.map((ans, idx) => (
        <div key={idx} className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder={`Answer ${idx + 1}`}
            value={ans}
            onChange={(e) => updateAnswer(idx, e.target.value)}
          />
          {question.type === 'single' ? (
            <input
              type="radio"
              name="correctSingle"
              checked={question.correctAnswers[0] === ans}
              onChange={() => toggleCorrectAnswer(ans)}
            />
          ) : (
            <input
              type="checkbox"
              checked={question.correctAnswers.includes(ans)}
              onChange={() => toggleCorrectAnswer(ans)}
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
      {question.answers.length < 6 && (
        <button
          onClick={addAnswer}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4"
        >
          Add Answer
        </button>
      )}

      <button
        onClick={save}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        Save and Return
      </button>
    </div>
  );
}
