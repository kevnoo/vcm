import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { useThemeStore, applyTheme } from './stores/theme.store';
import './app.css';

// Apply theme immediately to avoid flash
applyTheme(useThemeStore.getState().preference);

// Re-apply when preference changes
useThemeStore.subscribe((state) => applyTheme(state.preference));

// Listen for OS theme changes when preference is 'system'
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    const pref = useThemeStore.getState().preference;
    if (pref === 'system') applyTheme(pref);
  });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
