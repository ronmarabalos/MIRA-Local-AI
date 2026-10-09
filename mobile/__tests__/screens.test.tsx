/**
 * Every ported board renders on its own and shows its own copy.
 */
import React, { type ComponentType } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrefsProvider } from '../src/theme/prefs';
import ActivityScreen from '../src/screens/Activity';
import ApprovalsScreen from '../src/screens/Approvals';
import AssistantScreen from '../src/screens/Assistant';
import AutomationBuilderScreen from '../src/screens/AutomationBuilder';
import AutomationReviewScreen from '../src/screens/AutomationReview';
import AutomationsScreen from '../src/screens/Automations';
import ConnectedAppsScreen from '../src/screens/ConnectedApps';
import EmailDetailScreen from '../src/screens/EmailDetail';
import HomeScreen from '../src/screens/Home';
import InboxScreen from '../src/screens/Inbox';
import MemoryScreen from '../src/screens/Memory';
import ModelSetupScreen from '../src/screens/ModelSetup';
import NotificationsScreen from '../src/screens/Notifications';
import OfflineSyncScreen from '../src/screens/OfflineSync';
import OnboardingScreen from '../src/screens/Onboarding';
import PlannerScreen from '../src/screens/Planner';
import ProfileScreen from '../src/screens/Profile';
import SettingsScreen from '../src/screens/Settings';
import SetupScreen from '../src/screens/Setup';
import SplashScreen from '../src/screens/Splash';
import TeachScreen from '../src/screens/Teach';
import TeachExampleScreen from '../src/screens/TeachExample';
import TeachInstructionScreen from '../src/screens/TeachInstruction';

const Stack = createNativeStackNavigator();

jest.mock('../src/services/db', () => ({ getStore: jest.fn(() => new Promise(() => {})) }));

async function render(component: ComponentType<any>, params?: object) {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider>
        <PrefsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Board" component={component} initialParams={params} />
            </Stack.Navigator>
          </NavigationContainer>
        </PrefsProvider>
      </SafeAreaProvider>,
    );
  });
  // Virtualized lists can carry circular context in props; assert on rendered copy.
  const text = (
    node: ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererJSON[] | string | null,
  ): string => {
    if (node === null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(text).join(' ');
    return (node.children ?? []).map(text).join(' ');
  };
  try {
    return text(tree!.toJSON());
  } finally {
    await ReactTestRenderer.act(() => tree!.unmount());
  }
}

const BOARDS: [string, ComponentType<any>, string, object?][] = [
  ['01 splash', SplashScreen, 'Waking up your on-device assistant'],
  ['02 onboarding', OnboardingScreen, 'Allow notification access'],
  ['03 initial setup', SetupScreen, 'What should MIRA call you?'],
  ['04 model setup', ModelSetupScreen, 'MIRA runs on this phone'],
  ['05 home', HomeScreen, 'Here’s what matters today'],
  ['06 assistant', AssistantScreen, 'Ask MIRA'],
  ['07 teach', TeachScreen, 'Teach MIRA'],
  ['08 teach by instruction', TeachInstructionScreen, 'What would you like MIRA to learn?'],
  ['09 teach by example', TeachExampleScreen, 'Show MIRA an example.'],
  ['10 automation builder', AutomationBuilderScreen, 'Create an Automation'],
  ['11 review and approve', AutomationReviewScreen, 'Review rules'],
  ['12 my automations', AutomationsScreen, 'My automations'],
  ['13 inbox', InboxScreen, 'Nothing here right now'],
  ['14 email and reply', EmailDetailScreen, 'Message not found'],
  ['15 approval center', ApprovalsScreen, 'Needs Your Approval'],
  ['16 tasks', PlannerScreen, 'No tasks yet'],
  ['17 calendar', PlannerScreen, 'No events', { view: 'calendar' }],
  ['18 personal memory', MemoryScreen, 'What MIRA Remembers'],
  ['19 connected apps', ConnectedAppsScreen, 'Choose what MIRA can access.'],
  ['20 offline and sync', OfflineSyncScreen, 'Nothing is waiting'],
  ['21 activity history', ActivityScreen, 'Activity'],
  ['22 notifications', NotificationsScreen, 'Nothing new'],
  ['23 profile', ProfileScreen, 'Personal memory'],
  ['24 settings', SettingsScreen, 'Privacy proof'],
];

// Each row is passed as one object: with spread rows, Jest reads a missing
// trailing argument as a `done` callback and waits for it.
test.each(BOARDS.map(([name, component, expected, params]) => ({ name, component, expected, params })))(
  'board $name renders',
  async ({ component, expected, params }) => {
    expect(await render(component, params)).toContain(expected);
  },
);
