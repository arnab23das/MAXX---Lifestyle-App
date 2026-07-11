import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { OnboardingStackParamList } from '@/navigation/types';
import { signInWithEmail } from '@/api/auth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // RootNavigator reacts to the auth session change automatically.
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message ?? 'Check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginBottom: 8 }]}>Welcome back</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 24 }]}>
        Sign in to continue your path.
      </Text>

      <View style={{ gap: 12 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        />
        <Button label="Sign in" onPress={handleSignIn} loading={loading} />
        <Button label="Back" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 16 },
});
