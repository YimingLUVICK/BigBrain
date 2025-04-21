// Play.jsx
import { useEffect, useState, useRef } from 'react';

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