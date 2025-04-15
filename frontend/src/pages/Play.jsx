// Play.jsx
import { useEffect, useState } from 'react';

export default function Play({ sessionId }) {
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [step, setStep] = useState('join');
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState('');

  const joinSession = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/join/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setPlayerId(data.playerId);
      setStep('waiting');
    } catch (err) {
      setError('Join failed. Session may have started.');
    }
  };

  // Poll session status
  useEffect(() => {
    if (step === 'waiting' && playerId) {
      const interval = setInterval(async () => {
        const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
        const data = await res.json();
        if (data.started) {
          clearInterval(interval);
          setStep('playing');
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step, playerId]);

  // Fetch current question
  useEffect(() => {
    if (step === 'playing') {
      const fetchQ = async () => {
        const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
        const data = await res.json();
        setQuestion(data.question);
        setSelected([]);
        const duration = new Date(data.question.isoTimeLastQuestionStarted).getTime() + data.question.time * 1000;
        const interval = setInterval(() => {
          const now = Date.now();
          const secondsLeft = Math.floor((duration - now) / 1000);
          if (secondsLeft <= 0) {
            clearInterval(interval);
            setTimeLeft(0);
            setStep('answer');
            fetchAnswers();
          } else {
            setTimeLeft(secondsLeft);
          }
        }, 1000);
      };
      fetchQ();
    }
  }, [step]);

  const fetchAnswers = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/${playerId}/answer`);
      const data = await res.json();
      setCorrectAnswers(data.answerIds || []);
    } catch (err) {
      setCorrectAnswers([]);
    }
  };

  const handleSelect = async (id) => {
    let updated = [...selected];
    if (question.type === 'single') {
      updated = [id];
    } else {
      updated = updated.includes(id) ? updated.filter((i) => i !== id) : [...updated, id];
    }
    setSelected(updated);

    await fetch(`http://localhost:5005/play/${playerId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerIds: updated }),
    });
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (step === 'join') {
    return (
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Join Game</h2>
        <p className="mb-2">Session: {sessionId}</p>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded mb-4"
        />
        <button
          onClick={joinSession}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Join
        </button>
      </div>
    );
  }

  if (step === 'waiting') {
    return <div className="p-6 text-center text-lg">Please wait for game to start...</div>;
  }

  if (!question) return <div className="p-6">Loading question...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">{question.text}</h2>

      {question.image && (
        <img src={question.image} className="mb-4 w-full h-48 object-cover rounded" />
      )}

      {question.video && (
        <iframe
          src={question.video}
          className="mb-4 w-full h-48"
          title="Video"
          allow="accelerometer; autoplay; encrypted-media; gyroscope"
        />
      )}

      {step === 'playing' && (
        <div className="mb-4 text-sm text-gray-600">
          Time remaining: <span className="font-bold">{timeLeft}s</span>
        </div>
      )}

      <div className="space-y-2">
        {question.answers.map((ans) => (
          <div
            key={ans.id}
            className={`p-2 border rounded cursor-pointer ${
              step === 'answer' && correctAnswers.includes(ans.id)
                ? 'bg-green-200'
                : selected.includes(ans.id)
                ? 'bg-blue-200'
                : 'bg-white'
            }`}
            onClick={() => step === 'playing' && handleSelect(ans.id)}
          >
            {ans.text}
          </div>
        ))}
      </div>

      {step === 'answer' && (
        <div className="mt-4 text-green-700 font-semibold">Correct answer shown in green.</div>
      )}
    </div>
  );
}
