/**
 * Links between screens, named after the boards' `href` targets
 * (`Inbox.dc.html` is `go('Inbox')`), so screens read like the design.
 */
import { useCallback } from 'react';
import {
  CommonActions,
  StackActions,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type { RootStackParamList, TabParamList } from '../navigation';

export type Board =
  | Exclude<keyof RootStackParamList, 'Tabs'>
  | 'Home'
  | 'Inbox'
  | 'Teach'
  | 'Tasks'
  | 'Calendar'
  | 'Main';

type TabTarget = { [K in keyof TabParamList]: { screen: K; params?: TabParamList[K] } }[keyof TabParamList];

function tabFor(to: Board): TabTarget | null {
  switch (to) {
    case 'Home':
    case 'Inbox':
    case 'Teach':
      return { screen: to };
    case 'Tasks':
      return { screen: 'Planner', params: { view: 'tasks' } };
    case 'Calendar':
      return { screen: 'Planner', params: { view: 'calendar' } };
    default:
      return null;
  }
}

export function useGo() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return useCallback(
    /**
     * `reset` starts a fresh history (end of setup); `replace` swaps the
     * current screen; `firstRun` opens a setup screen as a first-visit step.
     */
    (to: Board, options?: { reset?: boolean; replace?: boolean; firstRun?: boolean }) => {
      const tab = tabFor(to);
      if (tab && options?.reset) {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs', params: tab }] }));
      } else if (tab) {
        // Back to the tab host if it is in the stack, so tabs never pile up.
        navigation.dispatch(StackActions.popTo('Tabs', tab));
      } else {
        // The boards' "Main" page is not in the design; About MIRA lives in onboarding.
        const name = to === 'Main' ? 'Onboarding' : (to as Exclude<Board, 'Main' | TabTarget['screen'] | 'Tasks' | 'Calendar'>);
        const params = options?.firstRun ? { firstRun: true } : undefined;
        navigation.dispatch(
          options?.replace ? StackActions.replace(name, params) : CommonActions.navigate({ name, params }),
        );
      }
    },
    [navigation],
  );
}

/** A board's back link: the previous screen, or the board's target if there is none. */
export function useBack(fallback: Board) {
  const navigation = useNavigation();
  const go = useGo();
  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      go(fallback);
    }
  }, [navigation, go, fallback]);
}
