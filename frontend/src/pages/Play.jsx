import { useEffect, useState } from 'react';

export default function Play({ sessionId }) {
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    const idFromUrl = window.location.hash.split('/')[2];
    if (idFromUrl && !sessionId) {
      sessionId = idFromUrl;
    }
  }, []);

  useEffect(() => {
    if (!playerId || answerRevealed) return;
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
      const data = await res.json();
      if (data.started) {
        setWaiting(false);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [playerId]);

  useEffect(() => {
    if (!waiting && playerId && !answerRevealed) {
      fetchQuestion();
    }
  }, [waiting, playerId]);

  const fetchQuestion = async () => {
    const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
    const data = await res.json();
    setQuestion(data.question);

    const startedAt = new Date(data.question.isoTimeLastQuestionStarted);
    const now = new Date();
    const duration = data.question.time || 10;
    const elapsed = Math.floor((now - startedAt) / 1000);
    const remaining = Math.max(0, duration - elapsed);
    setCountdown(remaining);

    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setAnswerRevealed(true);
          fetchCorrectAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  const fetchCorrectAnswers = async () => {
    const res = await fetch(`http://localhost:5005/play/${playerId}/answer`);
    const data = await res.json();
    setCorrectAnswers(data.answerIds);
  };

  const handleJoin = async () => {
    const res = await fetch(`http://localhost:5005/play/join/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });
    const data = await res.json();
    setPlayerId(data.playerId);
    setJoined(true);
  };

  const handleSelect = async (answerId) => {
    let updated;
    if (question.type === 'multiple') {
      updated = selected.includes(answerId)
        ? selected.filter((id) => id !== answerId)
        : [...selected, answerId];
    } else {
      updated = [answerId];
    }
    setSelected(updated);

    await fetch(`http://localhost:5005/play/${playerId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerIds: updated }),
    });
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Join Game Session</h1>
        <input
          type="text"
          placeholder="Your name"
          className="border p-2 rounded mb-4"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleJoin}
        >
          Join
        </button>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-100">
        <h2 className="text-xl font-bold">Please wait for the game to start...</h2>
      </div>
    );
  }

  if (!question) return <div className="p-6">Loading question...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{question.text}</h1>
      {question.image && (
        <img
          src={question.image}
          alt="Question"
          className="mb-4 w-full h-48 object-cover rounded"
        />
      )}
      {question.video && (
        <iframe
          className="mb-4 w-full h-64"
          src={question.video}
          title="YouTube video"
          allowFullScreen
        ></iframe>
      )}

      <p className="mb-2 font-semibold">Time Left: {countdown} seconds</p>

      <div className="space-y-2">
        {(question.answers || []).map((ans) => {
          const isSelected = selected.includes(ans.id);
          const isCorrect = correctAnswers.includes(ans.id);
          return (
            <div
              key={ans.id}
              className={`border rounded p-2 cursor-pointer ${
                isCorrect ? 'bg-green-200' : isSelected ? 'bg-blue-200' : 'bg-white'
              }`}
              onClick={() => !answerRevealed && handleSelect(ans.id)}
            >
              {ans.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
