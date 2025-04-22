import { useEffect, useState } from 'react';

export default function EditGame({ gameId }) {
  const [game, setGame] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const target = data.games.find(g => g.id.toString() === gameId);
        if (!target) {
          setError('Game not found');
        } else {
          setGame(target);
        }
      } catch {
        setError('Failed to fetch game');
      }
    };

    fetchGame();
  }, [gameId]);

  const updateGame = async (updatedGame) => {
    try {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const updatedList = data.games.map(g =>
        g.id.toString() === gameId ? updatedGame : g
      );

      await fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ games: updatedList }),
      });

      setGame(updatedGame);
    } catch {
      setError('Failed to update game');
    }
  };

  const handleDeleteQuestion = (idx) => {
    const updated = { ...game };
    updated.questions.splice(idx, 1);
    updateGame(updated);
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ = {
      text: newQuestionText,
      type: 'single',
      points: 0,
      duration: 30,
      correctAnswers: [],
      answers: [
        { answer: '' },
        { answer: '' }
      ],
    };
    const updated = {
      ...game,
      questions: [...(game.questions || []), newQ],
    };
    setNewQuestionText('');
    updateGame(updated);
  };  

  const handleMetaUpdate = (key, value) => {
    const updated = { ...game, [key]: value };
    updateGame(updated);
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!game) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Edit Game</h1>

      <button
        className="mb-4 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        onClick={() => window.location.hash = '/dashboard'}
      >
        ← Back to Dashboard
      </button>

      {/* Game Name */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Game Name</label>
        <input
          className="p-2 border rounded w-full"
          value={game.name}
          onChange={(e) => handleMetaUpdate('name', e.target.value)}
        />
      </div>

      {/* Thumbnail Upload */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Upload Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
              handleMetaUpdate('thumbnail', reader.result);
            };
            if (file) reader.readAsDataURL(file);
          }}
          className="mb-2"
        />

        {game.thumbnail ? (
          <div className="relative mt-2">
            <img
              src={game.thumbnail}
              alt="Thumbnail Preview"
              className="h-32 w-full object-cover rounded"
            />
            <button
              onClick={() => handleMetaUpdate('thumbnail', '')}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="h-32 bg-gray-200 flex items-center justify-center text-gray-500 rounded mt-2">
            No thumbnail
          </div>
        )}
      </div>


      {/* Questions */}
      <h2 className="text-xl font-bold mb-2">Questions</h2>
      {game.questions?.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {game.questions.map((q, i) => (
            <li
              key={i}
              className="bg-white p-2 border rounded flex justify-between items-center"
            >
              <span>{q.text || `Question ${i + 1}`}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.hash = `/game/${gameId}/question/${i}`}
                  className="text-sm bg-blue-400 hover:bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(i)}
                  className="text-sm bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-gray-500">No questions yet.</p>
      )}

      {/* Add New Question */}
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          placeholder="New question text"
          className="p-2 border rounded flex-1"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
        />
        <button
          onClick={handleAddQuestion}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Question
        </button>
      </div>
    </div>
  );
}
