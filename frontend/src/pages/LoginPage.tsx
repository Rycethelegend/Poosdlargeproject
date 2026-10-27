import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLayout from '../components/MenuLayout';
import { login } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter your username and password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/menu');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MenuLayout>
      <form className="menu-content" onSubmit={handleSubmit}>
        <input
          className="sketch-box"
          placeholder="Username..."
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="sketch-box"
          type="password"
          placeholder="Password..."
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="form-error">{error}</div>

        <div className="menu-button-row">
          <button type="submit" className="sketch-box" disabled={loading}>
            {loading ? '...' : 'Login'}
          </button>
          <button type="button" className="sketch-box" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </form>
    </MenuLayout>
  );
}
