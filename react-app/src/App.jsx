import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import History from './pages/History';
import Account from './pages/Account';
import Threshold from './pages/Threshold';
import Actuator from './pages/Actuator';
import Prediction from './pages/Prediction';
import About from './pages/About';
import DashboardLayout from './components/DashboardLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Dashboard Routes with Persistent Sidebar */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/home" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/account" element={<Account />} />
              <Route path="/threshold" element={<Threshold />} />
              <Route path="/actuator" element={<Actuator />} />
              <Route path="/brain" element={<Prediction />} />
              <Route path="/about" element={<About />} />
            </Route>
          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
