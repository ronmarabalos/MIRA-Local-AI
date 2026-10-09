/**
 * One board as a screen: the silk background, a scrolling column with the
 * board's padding and gap, and anything that floats above it (tab bar, FAB).
 * Boards are drawn on a 390-point phone whose status bar ends at 44 points,
 * so a board's top padding of 52 becomes the safe area plus 8.
 */
import { useCallback, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SilkBackground } from './SilkBackground';
import { TabBar, type Tab } from './TabBar';

const BOARD_STATUS_BAR = 44;

/** Light or dark status bar text while the screen is focused. */
export function useStatusBar(dark: boolean) {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content', true);
    }, [dark]),
  );
}

type Props = {
  children: ReactNode;
  /** The board's top padding. */
  top?: number;
  /** The board's side padding. */
  px?: number;
  /** The board's gap between sections. */
  gap?: number;
  /** The board's bottom padding (tab screens leave room for the bar). */
  bottom?: number;
  tab?: Tab;
  dark?: boolean;
  /** Floating elements drawn over the scroll view (FAB, Ask bar, sheets). */
  overlay?: ReactNode;
  /** Stretch to the screen height, for boards that pin buttons to the bottom. */
  fill?: boolean;
};

export function Screen({ children, top = 52, px = 20, gap = 16, bottom = 40, tab, dark = false, overlay, fill }: Props) {
  const insets = useSafeAreaInsets();
  useStatusBar(dark);
  return (
    <View className={`flex-1 ${dark ? 'bg-dk-bg' : 'bg-silk-base'}`}>
      <SilkBackground dark={dark} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + top - BOARD_STATUS_BAR,
            paddingHorizontal: px,
            paddingBottom: (tab ? Math.max(bottom, 120) : bottom) + insets.bottom,
            gap,
            flexGrow: fill ? 1 : undefined,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {overlay}
      {tab ? <TabBar active={tab} dark={dark} /> : null}
    </View>
  );
}
