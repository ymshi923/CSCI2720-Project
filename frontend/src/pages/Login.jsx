import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/pages.css';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login(username, password);
      } else {
        response = await authAPI.register(username, password, email);
      }

      const { token, user } = response.data;
      onLogin(user, token);
      navigate('/locations');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setUsername('testuser');
    setPassword('testuser123');
    setIsLogin(true);
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setIsLogin(true);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🎭 Cultural Events</h1>
        <h2>Venue Locator</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="toggle-mode">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="btn-link"
          >
            {isLogin ? 'Create account' : 'Already have account?'}
          </button>
        </div>

        <div className="test-credentials">
          <p>Quick Test:</p>
          <button type="button" onClick={fillTestCredentials} className="btn-secondary">
            Test User (testuser)
          </button>
          <button type="button" onClick={fillAdminCredentials} className="btn-secondary">
            Admin (admin)
          </button>
        </div>

        <div className="info-box">
          <p>Default test accounts are pre-created on first login.</p>
          <p>Use any combination to create a new account.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

