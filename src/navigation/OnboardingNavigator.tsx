import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { GoalSelectionScreen } from '@/screens/onboarding/GoalSelectionScreen';
import { PersonalizationChecklistScreen } from '@/screens/onboarding/PersonalizationChecklistScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { useTheme } from '@/theme';
import { themedHeaderOptions } from './screenOptions';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...themedHeaderOptions(theme) }}>
      <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
      <Stack.Screen name="PersonalizationChecklist" component={PersonalizationChecklistScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}
