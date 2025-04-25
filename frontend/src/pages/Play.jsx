import { useEffect, useState } from 'react';

export default function Play({ sessionId }) {
  // === State Declarations ===
  const [step, setStep] = useState('join'); // Current phase: join, waiting, playing, finished
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [lastStartTime, setLastStartTime] = useState(null);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [questionMeta, setQuestionMeta] = useState([]); // Store points and duration

  // === Lobby Stopwatch Minigame State ===
  const [stopwatch, setStopwatch] = useState(0);
  const [isTiming, setIsTiming] = useState(false);
  const [lobbyScore, setLobbyScore] = useState(0);

  // === Effect: Reset all state when switching sessions ===
  useEffect(() => {
    setPlayerId(null);
    setName('');
    setQuestion(null);
    setCountdown(null);
    setSelectedAnswers([]);
    setCorrectAnswers([]);
    setLastStartTime(null);
    setStep('join');

    // Retrieve saved playerId from localStorage if they rejoin the session
    const played = JSON.parse(localStorage.getItem('played_sessions') || '{}');
    const existingPlayerId = played[sessionId];
    if (existingPlayerId) {
      setPlayerId(parseInt(existingPlayerId));
      setStep('waiting');
    }
  }, [sessionId]);

  // === Function: Join session ===
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

      // Save playerId in localStorage for session persistence
      const played = JSON.parse(localStorage.getItem('played_sessions') || '{}');
      played[sessionId] = data.playerId;
      localStorage.setItem('played_sessions', JSON.stringify(played));
    } catch {
      setError('Failed to join session');
    }
  };

  // === Effect: Poll session status (waiting/playing) ===
  useEffect(() => {
    if (!playerId || step === 'finished') return;
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
      const data = await res.json();
      setStep(data.started ? 'playing' : 'waiting');
    }, 2000);
    return () => clearInterval(interval);
  }, [playerId, step]);

  // === Effect: Poll for current question during gameplay ===
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

        setQuestionMeta((prev) => ([
          ...prev,
          { text: q.text, points: q.points, duration: q.duration }
        ]));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, playerId, lastStartTime]);

  // === Effect: Poll for results when game finishes ===
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
        setError("Couldn't fetch results");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [playerId, step, sessionId]);

  // === Effect: Countdown timer for questions ===
  useEffect(() => {
    if (countdown === null || countdown <= 0 || correctAnswers.length > 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) fetchCorrectAnswers();
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // === Effect: Stopwatch minigame ticking logic ===
  useEffect(() => {
    let interval;
    if (isTiming) {
      interval = setInterval(() => {
        setStopwatch((prev) => prev + 0.01);
      }, 10); // 10ms for smooth timing
    }
    return () => clearInterval(interval);
  }, [isTiming]);

  // === Utility: Format player results for display ===
  const formatResults = (rawAnswers) => {
    return rawAnswers.map((entry, idx) => {
      const timeTaken = entry.answeredAt && entry.questionStartedAt
        ? (new Date(entry.answeredAt) - new Date(entry.questionStartedAt)) / 1000
        : null;
      const meta = questionMeta[idx] || {};
      const basePoints = meta.points || 0;
      const duration = meta.duration || 1;
      const rawScore = entry.correct && timeTaken
        ? basePoints * Math.max(0, 1 - (timeTaken / duration) / 2)
        : 0;
      const speedPoints = Math.round(rawScore * 10) / 10;

      return {
        question: `Q${idx + 1}`,
        correct: !!entry.correct,
        normalPoints: basePoints,
        speedPoints,
        timeTaken: timeTaken !== null ? timeTaken.toFixed(1) : null,
        answers: entry.answers || []
      };
    });
  };

  // === Fetch correct answers for the current question ===
  const fetchCorrectAnswers = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/${playerId}/answer`);
      const data = await res.json();
      setCorrectAnswers(data.answers);
    } catch {
      setError("Couldn't fetch answers");
    }
  };

  // === Submit selected answers to the server ===
  const submitAnswer = async (answersToSubmit = selectedAnswers) => {
    try {
      const answersAsValues = answersToSubmit.map(idx => question.answers[idx].answer);
      await fetch(`http://localhost:5005/play/${playerId}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersAsValues }),
      });
    } catch {
      setError("Couldn't submit answers");
    }
  };

  // === Handle selecting/deselecting an answer ===
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

  // === UI: Join screen ===
  if (step === 'join') {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4">Join Session {sessionId}</h2>
        <input
          className="border p-3 w-full rounded-2xl mb-4 shadow"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-2xl shadow"
          onClick={join}
        >
          Join
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    );
  }

  // === UI: Finished screen with results table ===
  if (step === 'finished') {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">🎉 Game Over! Here is how you did:</h2>
        <p className="text-sm text-gray-700 mb-6 text-center max-w-lg mx-auto">
          Your score for each question is calculated as
          <span className="font-semibold"> (1 - (Time Taken ÷ Question Duration) ÷ 2) × Question Points</span>.
          This rewards faster correct answers with higher points.
        </p>
        {results.length === 0 ? (
          <p className="text-center text-gray-600">No result data found.</p>
        ) : (
          <table className="table-auto w-full border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Question</th>
                <th className="px-4 py-2 text-center">Correct</th>
                <th className="px-4 py-2 text-center">Normal Points</th>
                <th className="px-4 py-2 text-center">Speed Points</th>
                <th className="px-4 py-2 text-center">Time (s)</th>
                <th className="px-4 py-2 text-left">Your Answers</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{res.question}</td>
                  <td className="px-4 py-2 text-center">{res.correct ? '✅' : '❌'}</td>
                  <td className="px-4 py-2 text-center">{res.normalPoints}</td>
                  <td className="px-4 py-2 text-center">{res.speedPoints}</td>
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

  // === UI: Waiting lobby with stopwatch minigame ===
  if (step === 'waiting') {
    return (
      <
        div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow text-center">
        <h2 className="text-2xl font-bold mb-2">⌛ Waiting in the Lobby...</h2>
        <p className="text-gray-600 mb-6">Try the stopwatch challenge while you wait!</p>
        <div className="text-5xl font-mono mb-4">{stopwatch.toFixed(2)}s</div>
        <div className="space-x-4 mb-6">
          {!isTiming ? (
            <button
              onClick={() => { setStopwatch(0); setIsTiming(true); }}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-2xl shadow"
            >
              Start
            </button>
          ) : (
            <button
              onClick={() => { setIsTiming(false); const diff = Math.abs(stopwatch - 5.0); if (diff <= 0.01) setLobbyScore((prev) => prev + 1); }}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-2xl shadow"
            >
              Stop
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">Stop the timer at exactly 5.0s!</p>
        <p className="mt-4 text-lg text-purple-600">🎯 Score: {lobbyScore}</p>
      </div>
    );
  }

  // === UI: Main gameplay (question/answer screen) ===
  if (!question) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow text-center">
        <p>Loading question...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{question.text}</h2>
      <p className="text-sm text-gray-600 mb-2">Type: {question.type}</p>
      <p className="text-sm mb-4">Time Left: {countdown}s</p>
      {/* show image (if have) */}
      {question.image && (
        <div className="mb-4">
          <img
            src={question.image}
            alt="Question visual"
            className="w-full max-h-64 object-contain rounded border"
          />
        </div>
      )}
      {/* show video url (if have) */}
      {question.video && (
        <div className="mb-4">
          <video
            controls
            className="w-full max-h-64 rounded border"
          >
            <source src={question.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {question.answers.map((ans, idx) => (
        <label key={idx} className="block mb-3">
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
        <p className="mt-4 text-green-600 font-semibold">Correct answers shown above.</p>
      )}
    </div>
  );
}