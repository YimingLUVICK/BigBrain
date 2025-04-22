// Play.jsx
import { useEffect, useState } from 'react';

export default function Play({ sessionId }) {
  const [step, setStep] = useState('join');
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [lastStartTime, setLastStartTime] = useState(null);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    setPlayerId(null);
    setName('');
    setQuestion(null);
    setCountdown(null);
    setSelectedAnswers([]);
    setCorrectAnswers([]);
    setLastStartTime(null);
    setStep('join');

    const played = JSON.parse(localStorage.getItem('played_sessions') || '{}');
    const existingPlayerId = played[sessionId];
    if (existingPlayerId) {
      setPlayerId(parseInt(existingPlayerId));
      setStep('waiting');
    }
  }, [sessionId]);

  const join = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/join/${parseInt(sessionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      setPlayerId(data.playerId);
      setStep('waiting');

      const played = JSON.parse(localStorage.getItem('played_sessions') || '{}');
      played[sessionId] = data.playerId;
      localStorage.setItem('played_sessions', JSON.stringify(played));
    } catch {
      setError('Failed to join session');
    }
  };

  useEffect(() => {
    if (!playerId || step === 'finished') return;
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
      const data = await res.json();
      if (data.started) {
        setStep('playing');
      } else {
        setStep('waiting');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [playerId, step]);

  useEffect(() => {
    if (step !== 'playing' || !playerId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
      const data = await res.json();
      const q = data.question;

      if (q.isoTimeLastQuestionStarted !== lastStartTime) {
        setQuestion(q);
        setCountdown(q.duration);
        setSelectedAnswers([]);
        setCorrectAnswers([]);
        setLastStartTime(q.isoTimeLastQuestionStarted);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, playerId, lastStartTime]);

  const formatResults = (rawAnswers) => {
    return rawAnswers.map((entry, idx) => {
      const timeTaken = entry.answeredAt && entry.questionStartedAt
        ? (new Date(entry.answeredAt) - new Date(entry.questionStartedAt)) / 1000
        : null;
  
      return {
        question: idx + 1,
        correct: !!entry.correct,
        score: entry.correct ? 1 : 0,
        timeTaken: timeTaken !== null ? timeTaken.toFixed(1) : null,
        answers: entry.answers || []
      };
    });
  };

  useEffect(() => {
    if (!playerId || step === 'finished') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5005/play/${playerId}/results`);

        if (res.ok) {
          const data = await res.json();
          const storedResults = JSON.parse(localStorage.getItem('player_results') || '{}');
          storedResults[sessionId] = data;
          localStorage.setItem('player_results', JSON.stringify(storedResults));
          setStep('finished');
          setResults(formatResults(data));
        }
      } catch {
        setError("Couldn't fetch results")
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [playerId, step, sessionId]);

  useEffect(() => {
    if (countdown === null || countdown <= 0 || correctAnswers.length > 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) fetchCorrectAnswers();
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchCorrectAnswers = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/${playerId}/answer`);
      const data = await res.json();
      setCorrectAnswers(data.answers);
    } catch {
      setError("Couldn't fetch answers")
    }
  };

  const submitAnswer = async (answersToSubmit = selectedAnswers) => {
    try {
      await fetch(`http://localhost:5005/play/${playerId}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSubmit })
      });
    } catch {
      setError("Couldnt submit answers")
    }
  };

  const toggleSelect = (idx) => {
    let updated;
    if (question.type === 'single' || question.type === 'judgement') {
      updated = [idx];
    } else {
      updated = selectedAnswers.includes(idx)
        ? selectedAnswers.filter(i => i !== idx)
        : [...selectedAnswers, idx];
    }
    setSelectedAnswers(updated);
    submitAnswer(updated);
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
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={join}>
          Join
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  if (step === 'waiting') {
    return <div className="p-6">Waiting for the host to start the game...</div>;
  } else if (step === 'finished') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">🎉 Game Over! Here is how you did:</h2>
        {results.length === 0 ? (
          <p className="text-center text-gray-600">No result data found.</p>
        ) : (
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Question</th>
                <th className="px-4 py-2 text-center">Correct</th>
                <th className="px-4 py-2 text-center">Points</th>
                <th className="px-4 py-2 text-center">Time Taken (s)</th>
                <th className="px-4 py-2 text-left">Your Answers</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">Q{res.question}</td>
                  <td className="px-4 py-2 text-center">{res.correct ? '✅' : '❌'}</td>
                  <td className="px-4 py-2 text-center">{res.score}</td>
                  <td className="px-4 py-2 text-center">{res.timeTaken ?? '-'}</td>
                  <td className="px-4 py-2">{res.answers?.join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  } 

  if (!question) {
    return <div className="p-6">Loading question...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{question.text}</h2>
      <p className="text-sm text-gray-600 mb-2">Type: {question.type}</p>
      <p className="text-sm mb-4">Time Left: {countdown}s</p>

      {question.answers.map((ans, idx) => (
        <label key={idx} className="block mb-2">
          <input
            type={question.type === 'multiple' ? 'checkbox' : 'radio'}
            name="answer"
            value={idx}
            checked={selectedAnswers.includes(idx)}
            disabled={correctAnswers.length > 0}
            onChange={() => toggleSelect(idx)}
            className="mr-2"
          />
          {ans.answer}
          {correctAnswers.includes(ans.answer) && (
            <span className="text-green-500 ml-2">✓</span>
          )}
        </label>
      ))}

      {correctAnswers.length > 0 && (
        <p className="mt-4 text-green-600">Correct answers shown above.</p>
      )}
    </div>
  );
}