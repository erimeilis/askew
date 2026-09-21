import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/editor/App';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
