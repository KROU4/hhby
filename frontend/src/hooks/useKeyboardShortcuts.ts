import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if Ctrl/Cmd is pressed
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+K even in inputs
        if (!(isCtrlOrCmd && event.key === 'k')) {
          return;
        }
      }

      // Ctrl+K: Focus search / Go to search page
      if (isCtrlOrCmd && event.key === 'k') {
        event.preventDefault();
        navigate('/search');
        // Focus the first input on the page after navigation
        setTimeout(() => {
          const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
        return;
      }

      // Only handle shortcuts when not typing
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Alt+1: Dashboard
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        navigate('/dashboard');
      }

      // Alt+2: Search
      if (event.altKey && event.key === '2') {
        event.preventDefault();
        navigate('/search');
      }

      // Alt+3: Applications
      if (event.altKey && event.key === '3') {
        event.preventDefault();
        navigate('/applications');
      }

      // Alt+4: Employers
      if (event.altKey && event.key === '4') {
        event.preventDefault();
        navigate('/employers');
      }

      // Alt+5: Favorites
      if (event.altKey && event.key === '5') {
        event.preventDefault();
        navigate('/favorites');
      }

      // Alt+6: History
      if (event.altKey && event.key === '6') {
        event.preventDefault();
        navigate('/history');
      }

      // Alt+7: Settings
      if (event.altKey && event.key === '7') {
        event.preventDefault();
        navigate('/settings');
      }

      // ? : Show shortcuts help
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        // This will be handled by a modal component
        window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);
};
