import { useNavigate } from 'react-router-dom';
import MenuLayout from '../components/MenuLayout';

// Placeholder for screens that haven't been built yet
export default function ComingSoonPage({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <MenuLayout>
      <h2 className="fs-3">{title}</h2>
      <p>Coming soon.</p>
      <button type="button" className="sketch-box" onClick={() => navigate('/menu')}>
        Back
      </button>
    </MenuLayout>
  );
}
