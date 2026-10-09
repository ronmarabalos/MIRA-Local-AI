/**
 * Every screen is registered here in Phase 0, so each lane fills in files
 * that already exist. Only Lane B edits this file afterwards.
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ActivityLogScreen from './screens/ActivityLog';
import ApprovalsScreen from './screens/Approvals';
import AskScreen from './screens/Ask';
import ChannelsScreen from './screens/Channels';
import ItemDetailScreen from './screens/ItemDetail';
import OnboardingScreen from './screens/Onboarding';
import PrivacyProofScreen from './screens/PrivacyProof';
import RulesScreen from './screens/Rules';
import TodayScreen from './screens/Today';

export type TabParamList = {
  Today: undefined;
  Ask: undefined;
  Approvals: undefined;
  Rules: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ItemDetail: { messageId: string };
  Channels: undefined;
  ActivityLog: undefined;
  PrivacyProof: undefined;
  Onboarding: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Ask" component={AskScreen} />
      <Tab.Screen name="Approvals" component={ApprovalsScreen} />
      <Tab.Screen name="Rules" component={RulesScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Message' }} />
      <Stack.Screen name="Channels" component={ChannelsScreen} />
      <Stack.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="PrivacyProof" component={PrivacyProofScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
