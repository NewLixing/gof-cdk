import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserPage from './pages/UserPage';
import ManagerPage from './pages/ManagerPage';

const isManagerEnabled = import.meta.env.VITE_ENABLE_MANAGER_PAGE === 'true';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserPage />} />
        {isManagerEnabled && <Route path="/manager" element={<ManagerPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
