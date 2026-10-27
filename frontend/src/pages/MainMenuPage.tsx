import { useNavigate } from 'react-router-dom';
import MenuLayout from '../components/MenuLayout';
import { getUsername, logout } from '../api';

export default function MainMenuPage() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <MenuLayout>
      <button type="button" className="sketch-box" onClick={() => navigate('/play')}>
        Start
      </button>

      <div className="fs-5 mt-3">{getUsername()}</div>

      <div className="menu-button-row mt-0">
        <button type="button" className="sketch-box" onClick={() => navigate('/profile')}>
          Your Profile
        </button>
        <button type="button" className="sketch-box" onClick={() => navigate('/leaderboard')}>
          Leaderboard
        </button>
      </div>

      <button type="button" className="btn btn-link text-dark mt-4" onClick={handleLogout}>
        Log out
      </button>
    </MenuLayout>
  );
}
