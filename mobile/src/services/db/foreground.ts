import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/** Refresh native facts after settings, permissions, or day boundaries change. */
export function useForegroundRetry(retry: () => void) {
  useFocusEffect(
    useCallback(() => {
      retry();
    }, [retry]),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') retry();
    });
    return () => listener.remove();
  }, [retry]);
}
