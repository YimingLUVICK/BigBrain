// Play.jsx
import { useEffect, useState, useRef } from 'react';

export default function Play({ sessionId }) {
  const [step, setStep] = useState('join');
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [correctIds, setCorrectIds] = useState([]);
  const [answerAvailable, setAnswerAvailable] = useState(false);
  const [error, setError] = useState('');
  const positionRef = useRef(-1);

  const fetchSessionPosition = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/session/${sessionId}/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      return data.results.position;
    } catch {
      return -1;
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!playerId || step !== 'waiting') return;
      const pos = await fetchSessionPosition();
      if (pos >= 0) {
        positionRef.current = pos;
        fetchQuestion();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [playerId, step]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!playerId || step !== 'playing') return;
      const pos = await fetchSessionPosition();
      if (pos !== positionRef.current) {
        positionRef.current = pos;
        fetchQuestion();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [playerId, step]);

  const join = async () => {
    try {
      const pos = await fetchSessionPosition();
      if (pos >= 0) {
        setError('Game already started. You cannot join.');
        return;
      }
      const res = await fetch(`http://localhost:5005/play/join/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      setPlayerId(data.playerId);
      setStep('waiting');
    } catch {
      setError('Failed to join session');
    }
  };

  const fetchQuestion = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
      const data = await res.json();
      setQuestion(data.question);
      setCountdown(data.question.time);
      setSelectedIds([]);
      setAnswerAvailable(false);
      setCorrectIds([]);
      setStep('playing');
    } catch {
      setStep('finished');
    }
  };

  useEffect(() => {
    if (!question || countdown === null || answerAvailable) return;
    if (countdown <= 0) {
      fetchCorrect();
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, question, answerAvailable]);

  const fetchCorrect = async () => {
    try {
      const res = await fetch(`http://localhost:5005/admin/session/${sessionId}/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const pos = data.results.position;
      const corrects = data.results.questions[pos].answers
        .filter(a => a.correct)
        .map(a => a.id);
      setCorrectIds(corrects);
      setAnswerAvailable(true);
    } catch {
      setStep('finished');
    }
  };

  const submitAnswer = async () => {
    try {
      await fetch(`http://localhost:5005/play/${playerId}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIds: selectedIds })
      });
    } catch {}
  };

  const toggleSelect = (id) => {
    if (question.type === 'single' || question.type === 'truefalse') {
      setSelectedIds([id]);
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  if (step === 'join') {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Join Session {sessionId}</h2>
        <input
          className="border p-2 w-full mb-4"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={join}
        >
          Join
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  if (step === 'waiting') {
    return <div className="p-6">Waiting for game to start...</div>;
  }

  if (step === 'finished') {
    return <div className="p-6">Game Over</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{question.text}</h2>
      <p className="mb-2 text-sm text-gray-600">Type: {question.type}</p>
      <p className="mb-4 text-sm">Time Left: {countdown}s</p>

      {question.answers.map((ans) => (
        <label key={ans.id} className="block mb-2">
          <input
            type={question.type === 'multiple' ? 'checkbox' : 'radio'}
            name="answer"
            value={ans.id}
            checked={selectedIds.includes(ans.id)}
            onChange={() => toggleSelect(ans.id)}
            disabled={answerAvailable}
            className="mr-2"
          />
          {ans.text} {answerAvailable && correctIds.includes(ans.id) && <span className="text-green-500">✓</span>}
        </label>
      ))}

      <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={answerAvailable}
        onClick={submitAnswer}
      >
        Submit Answer
      </button>

      {answerAvailable && (
        <p className="mt-4 text-green-600">Correct answers are shown above.</p>
      )}
    </div>
  );
}