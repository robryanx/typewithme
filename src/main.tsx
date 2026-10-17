import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './components/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');
createRoot(rootElement).render(<App />);
