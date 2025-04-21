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
    } catch {
      setError('Failed to join session');
    }
  };

  useEffect(() => {
    if (!playerId) return;
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
  }, [playerId]);

  useEffect(() => {
    if (step !== 'playing' || !playerId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
      const data = await res.json();
      const q = data.question;

      // 检测是否为新问题（时间戳变化）
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

  // 倒计时逻辑
  useEffect(() => {
    if (countdown === null || countdown <= 0 || correctAnswers.length > 0) return;

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    if (countdown === 1) {
      fetchCorrectAnswers();
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchCorrectAnswers = async () => {
    try {
      const res = await fetch(`http://localhost:5005/play/${playerId}/answer`);
      const data = await res.json();
      setCorrectAnswers(data.answers); // ✅ 正确字段名
    } catch {}
  };

  const submitAnswer = async () => {
    try {
      await fetch(`http://localhost:5005/play/${playerId}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers }) // ✅ 正确字段名
      });
    } catch {}
  };

  const toggleSelect = (ansText) => {
    if (question.type === 'single' || question.type === 'judgement') {
      setSelectedAnswers([ansText]);
    } else {
      setSelectedAnswers(prev =>
        prev.includes(ansText) ? prev.filter(a => a !== ansText) : [...prev, ansText]
      );
    }
  };

  // UI 渲染部分
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
    return <div className="p-6">Game not started or ended</div>;
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
            value={ans.answer}
            checked={selectedAnswers.includes(ans.answer)}
            disabled={correctAnswers.length > 0}
            onChange={() => toggleSelect(ans.answer)}
            className="mr-2"
          />
          {ans.answer}
          {correctAnswers.includes(ans.answer) && (
            <span className="text-green-500 ml-2">✓</span>
          )}
        </label>
      ))}

      <button
        onClick={submitAnswer}
        disabled={correctAnswers.length > 0}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Submit Answer
      </button>

      {correctAnswers.length > 0 && (
        <p className="mt-4 text-green-600">Correct answers shown above.</p>
      )}
    </div>
  );
}