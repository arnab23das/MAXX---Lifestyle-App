import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { darkColors } from '@/theme/colors';

interface State {
  error: Error | null;
}

/**
 * Last-resort fallback for uncaught render-time errors (e.g. a third-party
 * hook throwing because of missing config — see Google sign-in on web).
 * Without this, React unmounts the whole tree on any uncaught error and the
 * user sees a silent blank white screen with no indication anything broke.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: darkColors.background }} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: darkColors.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: darkColors.border },
  title: { color: darkColors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { color: darkColors.textSecondary, fontSize: 14, lineHeight: 20 },
});
