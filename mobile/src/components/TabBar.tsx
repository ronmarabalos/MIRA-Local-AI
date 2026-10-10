/**
 * The floating tab bar from the boards: Home, Inbox, MIRA, Teach, Planner.
 * The current tab is a dark pill with its label; MIRA opens the assistant.
 */
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fx } from '../theme/effects';
import palette from '../theme/palette';
import { Companion } from './Companion';
import { Icon, type IconName } from './Icon';
import { useGo, type Board } from './nav';
import { T } from './T';
import { Tap } from './ui';

export type Tab = 'Home' | 'Inbox' | 'Teach' | 'Planner';

const TABS: { tab: Tab; icon: IconName; to: Board }[] = [
  { tab: 'Home', icon: 'home', to: 'Home' },
  { tab: 'Inbox', icon: 'mail', to: 'Inbox' },
  { tab: 'Teach', icon: 'bulb', to: 'Teach' },
  { tab: 'Planner', icon: 'planner', to: 'Tasks' },
];

/** Distance of the bar from the bottom edge, as on the boards. */
export function useTabBarBottom(): number {
  return Math.max(16, useSafeAreaInsets().bottom - 8);
}

export function TabBar({ active, dark = false }: { active: Tab; dark?: boolean }) {
  const go = useGo();
  const bottom = useTabBarBottom();
  const idle = dark ? palette.dk.text2 : palette.ink.body;

  const item = ({ tab, icon, to }: (typeof TABS)[number]) =>
    tab === active ? (
      <Tap
        key={tab}
        label={tab}
        accessibilityState={{ selected: true }}
        onPress={() => go(to)}
        className={`h-52 w-52 items-center justify-center rounded-full ${dark ? 'bg-dk-chip' : 'bg-ink'}`}
        style={fx.tabActive}
      >
        <Icon name={icon} size={21} strokeWidth={2} color={dark ? palette.dk.bg : palette.white} />
      </Tap>
    ) : (
      <Tap key={tab} label={tab} onPress={() => go(to)} className="h-52 w-52 items-center justify-center rounded-full">
        <Icon name={icon} size={21} strokeWidth={1.8} color={idle} />
      </Tap>
    );

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 items-center" style={{ bottom }}>
      <View
        accessibilityRole="tablist"
        className={`h-64 flex-row items-center gap-4 rounded-full border p-6 ${
          dark ? 'border-white/14 bg-white/8' : 'border-white/85 bg-white/55'
        }`}
        style={dark ? fx.tabBarDark : fx.tabBar}
      >
        {item(TABS[0])}
        {item(TABS[1])}
        <Tap label="MIRA" onPress={() => go('Assistant')} className="h-52 w-52 items-center justify-center rounded-full">
          <Companion size={32} theme={dark ? 'dark' : 'light'} />
        </Tap>
        {item(TABS[2])}
        {item(TABS[3])}
      </View>
    </View>
  );
}
