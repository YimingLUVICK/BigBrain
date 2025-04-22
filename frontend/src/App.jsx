import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 
import Editgame from './pages/Editgame';
import Editquestion from './pages/Editquestion';
import Sessioncontrol from './pages/Sessioncontrol';
import Play from './pages/Play';
import PastSessions from './pages/PastSessions';

function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  let Page;
  if (route === '/login') {
    Page = <Login />;
  } else if (route === '/register') {
    Page = <Register />;
  } else if (route === '/dashboard') {
    Page = <Dashboard />;
  } else if (route.startsWith('/session/')) {
    const sessionId = route.split('/')[2];
    Page = <Sessioncontrol sessionId={sessionId} />;
  } else if (route.startsWith('/game/') && route.endsWith('/sessions')) {
    const gameId = route.split('/')[2];
    Page = <PastSessions gameId={gameId} />;  
  } else if (route.startsWith('/game/') && route.includes('/question/')) {
    // ✅ 支持路径：/#/game/{gameId}/question/{questionId}
    const parts = route.split('/');
    const gameId = parts[2];
    const questionId = parts[4];
    Page = <Editquestion gameId={gameId} questionId={questionId} />;
  } else if (route.startsWith('/game/')) {
    // ✅ 支持路径：/#/game/{gameId}
    const gameId = route.split('/')[2];
    Page = <Editgame gameId={gameId} />;
  } else if (route.startsWith('/play/')) {
    const sessionId = route.split('/')[2];
    Page = <Play sessionId={sessionId} />;
  } else {
    Page = (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold mb-6">Welcome to BigBrain!</h1>
        <div className="space-x-4">
          <a
            href="#/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Login
          </a>
          <a
            href="#/register"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Register
          </a>
        </div>
      </div>
    );
  }

  return <div>{Page}</div>;
}

export default App;
