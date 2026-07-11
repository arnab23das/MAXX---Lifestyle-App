import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from './types';
import { MainLevelPathScreen } from '@/screens/levelpath/MainLevelPathScreen';
import { CommunityFeedScreen } from '@/screens/community/CommunityFeedScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { useTheme } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  PathTab: '🧭',
  CommunityTab: '💬',
  SettingsTab: '⚙️',
};

export function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surfaceRaised, borderTopColor: theme.colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="PathTab" component={MainLevelPathScreen} options={{ tabBarLabel: 'Path' }} />
      <Tab.Screen name="CommunityTab" component={CommunityFeedScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}
