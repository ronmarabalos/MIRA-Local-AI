/**
 * App-wide preferences the screens share: the name typed during setup, the
 * theme chosen in Settings, and reduced motion (the system setting or the
 * switch in Settings). Kept in memory for now; storage is task B1.3.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

export type ThemeChoice = 'light' | 'dark' | 'system';

interface Prefs {
  name: string;
  setName(name: string): void;
  theme: ThemeChoice;
  setTheme(theme: ThemeChoice): void;
  /** True when the resolved theme is dark. Only Home has a dark board. */
  isDark: boolean;
  reduceMotionSetting: boolean;
  setReduceMotionSetting(on: boolean): void;
  /** The system setting or the Settings switch. */
  reduceMotion: boolean;
}

const PrefsContext = createContext<Prefs | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<ThemeChoice>('light');
  const [reduceMotionSetting, setReduceMotionSetting] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => sub.remove();
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      name,
      setName,
      theme,
      setTheme,
      isDark: theme === 'dark' || (theme === 'system' && scheme === 'dark'),
      reduceMotionSetting,
      setReduceMotionSetting,
      reduceMotion: systemReduceMotion || reduceMotionSetting,
    }),
    [name, theme, scheme, reduceMotionSetting, systemReduceMotion],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext);
  if (!prefs) {
    throw new Error('usePrefs must be used inside PrefsProvider');
  }
  return prefs;
}

/** The name as typed, or a plain word when none has been given. */
export function useDisplayName(): string {
  return usePrefs().name.trim() || 'You';
}
