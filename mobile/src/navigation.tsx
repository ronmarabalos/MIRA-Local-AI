/**
 * Every board in docs/design/screens is a screen here, linked the way the
 * boards link to each other. Home, Inbox, Teach, and Planner are tabs; the
 * floating tab bar is drawn by each screen that shows it, as on the boards.
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import palette from './theme/palette';
import ActivityScreen from './screens/Activity';
import ApprovalsScreen from './screens/Approvals';
import AssistantScreen from './screens/Assistant';
import AutomationBuilderScreen from './screens/AutomationBuilder';
import AutomationReviewScreen from './screens/AutomationReview';
import AutomationsScreen from './screens/Automations';
import ConnectedAppsScreen from './screens/ConnectedApps';
import EmailDetailScreen from './screens/EmailDetail';
import HomeScreen from './screens/Home';
import InboxScreen from './screens/Inbox';
import MemoryScreen from './screens/Memory';
import KeepWordsScreen from './screens/KeepWords';
import ReplyHelperScreen from './screens/ReplyHelper';
import MiraFileScreen from './screens/MiraFile';
import ModelSetupScreen from './screens/ModelSetup';
import NotificationsScreen from './screens/Notifications';
import OfflineSyncScreen from './screens/OfflineSync';
import OnboardingScreen from './screens/Onboarding';
import PlannerScreen from './screens/Planner';
import ProfileScreen from './screens/Profile';
import SettingsScreen from './screens/Settings';
import SetupScreen from './screens/Setup';
import SplashScreen from './screens/Splash';
import TeachScreen from './screens/Teach';
import TeachExampleScreen from './screens/TeachExample';
import TeachInstructionScreen from './screens/TeachInstruction';

export type TabParamList = {
  Home: undefined;
  Inbox: undefined;
  Teach: undefined;
  /** Tasks (board 16) or Calendar (board 17). */
  Planner: { view?: 'tasks' | 'calendar' } | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  /** `firstRun` shows the step bar; otherwise this is Personal information. */
  Setup: { firstRun?: boolean } | undefined;
  ModelSetup: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Assistant: undefined;
  TeachInstruction: undefined;
  TeachExample: undefined;
  AutomationBuilder: undefined;
  AutomationReview: undefined;
  Automations: undefined;
  EmailDetail: { messageId: string } | undefined;
  Approvals: undefined;
  Memory: undefined;
  /** `firstRun` is step 3 of the first visit. */
  ConnectedApps: { firstRun?: boolean } | undefined;
  MiraFile: undefined;
  KeepWords: undefined;
  ReplyHelper: undefined;
  OfflineSync: undefined;
  Activity: undefined;
  Notifications: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator tabBar={() => null} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Teach" component={TeachScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.silk.base } }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Setup" component={SetupScreen} />
      <Stack.Screen name="ModelSetup" component={ModelSetupScreen} />
      <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="Assistant" component={AssistantScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="TeachInstruction" component={TeachInstructionScreen} />
      <Stack.Screen name="TeachExample" component={TeachExampleScreen} />
      <Stack.Screen name="AutomationBuilder" component={AutomationBuilderScreen} />
      <Stack.Screen name="AutomationReview" component={AutomationReviewScreen} />
      <Stack.Screen name="Automations" component={AutomationsScreen} />
      <Stack.Screen name="EmailDetail" component={EmailDetailScreen} />
      <Stack.Screen name="Approvals" component={ApprovalsScreen} />
      <Stack.Screen name="Memory" component={MemoryScreen} />
      <Stack.Screen name="ConnectedApps" component={ConnectedAppsScreen} />
      <Stack.Screen name="MiraFile" component={MiraFileScreen} />
      <Stack.Screen name="KeepWords" component={KeepWordsScreen} />
      <Stack.Screen name="ReplyHelper" component={ReplyHelperScreen} />
      <Stack.Screen name="OfflineSync" component={OfflineSyncScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
