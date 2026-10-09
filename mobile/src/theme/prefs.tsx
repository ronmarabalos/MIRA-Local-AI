/**
 * App-wide preferences the screens share: the name typed during setup, the
 * theme chosen in Settings, and reduced motion (the system setting or the
 * switch in Settings). Stored on the phone, so they survive a restart.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

type PrefKey = 'name' | 'theme' | 'reduceMotion';

const THEMES: readonly string[] = ['light', 'dark', 'system'];

/** Where the choices are kept. Without it they last only for this session. */
export interface PrefsStorage {
  load(): Promise<Record<string, string>>;
  save(key: string, value: string): Promise<void>;
}

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

export function PrefsProvider({ children, storage }: { children: ReactNode; storage?: PrefsStorage }) {
  const [name, setNameState] = useState('');
  const [theme, setThemeState] = useState<ThemeChoice>('light');
  const [reduceMotionSetting, setReduceMotionState] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const scheme = useColorScheme();
  // Choices made before the stored ones load are kept, not overwritten.
  const touched = useRef(new Set<PrefKey>());
  const storageRef = useRef(storage);
  storageRef.current = storage;

  // A choice that fails to save stays for this session.
  const persist = useCallback((key: PrefKey, value: string) => {
    const target = storageRef.current;
    if (target) {
      Promise.resolve().then(() => target.save(key, value)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let live = true;
    const target = storageRef.current;
    if (!target) return;
    Promise.resolve()
      .then(() => target.load())
      .then(stored => {
        if (!live || !stored) return;
        const fresh = (key: PrefKey) => stored[key] !== undefined && !touched.current.has(key);
        if (fresh('name')) setNameState(stored.name);
        if (fresh('theme') && THEMES.includes(stored.theme)) setThemeState(stored.theme as ThemeChoice);
        if (fresh('reduceMotion')) setReduceMotionState(stored.reduceMotion === '1');
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const setName = useCallback((next: string) => {
    touched.current.add('name');
    setNameState(next);
    persist('name', next);
  }, [persist]);
  const setTheme = useCallback((next: ThemeChoice) => {
    touched.current.add('theme');
    setThemeState(next);
    persist('theme', next);
  }, [persist]);
  const setReduceMotionSetting = useCallback((on: boolean) => {
    touched.current.add('reduceMotion');
    setReduceMotionState(on);
    persist('reduceMotion', on ? '1' : '0');
  }, [persist]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion).catch(() => {});
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
    [name, setName, theme, setTheme, scheme, reduceMotionSetting, setReduceMotionSetting, systemReduceMotion],
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
