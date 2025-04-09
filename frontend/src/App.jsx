import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 
import EditGame from './pages/EditGame';
import EditQuestion from './pages/EditQuestion';

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
  } else if (route.startsWith('/game/') && !route.includes('/question/')) {
    Page = <EditGame />;
  } else if (route.includes('/question/')) {
    Page = <EditQuestion />;
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
