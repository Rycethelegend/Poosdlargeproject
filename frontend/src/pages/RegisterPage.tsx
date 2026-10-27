import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLayout from '../components/MenuLayout';
import { register } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password || !email || !confirmPassword) {
      setError('Please fill in every field');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({ username, password, confirmPassword, email });
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
          placeholder="Choose Username..."
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="sketch-box"
          type="password"
          placeholder="Choose Password..."
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="sketch-box"
          type="email"
          placeholder="Preferred Email..."
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="sketch-box"
          type="password"
          placeholder="Confirm Password..."
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="form-error">{error}</div>

        <div className="menu-button-row">
          <button type="button" className="sketch-box" onClick={() => navigate('/login')}>
            Login
          </button>
          <button type="submit" className="sketch-box" disabled={loading}>
            {loading ? '...' : 'Register'}
          </button>
        </div>
      </form>
    </MenuLayout>
  );
}
