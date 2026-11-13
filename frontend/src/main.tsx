// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applySavedTheme } from './theme.ts'

// Before the first render so dark mode doesn't flash light
applySavedTheme();

createRoot(document.getElementById('root')!).render(
    <App />
)
