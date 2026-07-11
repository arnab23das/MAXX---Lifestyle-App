import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SplashScreen } from '@/screens/onboarding/SplashScreen';
import { useAppFonts } from '@/theme/useAppFonts';

export default function App() {
  const fontsLoaded = useAppFonts();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fontsLoaded ? <RootNavigator /> : <SplashScreen />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
