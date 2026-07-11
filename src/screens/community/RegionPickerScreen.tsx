import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RegionPicker'>;

// "Local" community is powered by a user-selected region rather than precise
// geolocation (spec §6 decision) — safer for privacy and simpler to reason about.
const REGIONS = [
  'US - Northeast', 'US - Southeast', 'US - Midwest', 'US - Southwest', 'US - West',
  'Canada', 'United Kingdom', 'Europe', 'Australia / NZ', 'Asia', 'Other',
];

export function RegionPickerScreen({ navigation }: Props) {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const setRegion = useAppStore((s) => s.setRegion);
  const session = useAuthStore((s) => s.session);
  const [selected, setSelected] = useState(profile?.region ?? '');

  async function handleSave() {
    if (!session?.user || !selected) return;
    await setRegion(session.user.id, selected);
    navigation.goBack();
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 8 }]}>Choose your region</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
        This powers your local community feed and SOS broadcasts. We never share your precise location.
      </Text>
      <View style={{ gap: 10 }}>
        {REGIONS.map((region) => (
          <Pressable
            key={region}
            onPress={() => setSelected(region)}
            style={[
              styles.row,
              {
                borderColor: selected === region ? theme.colors.primary : theme.colors.border,
                backgroundColor: selected === region ? theme.colors.primarySoft : theme.colors.surface,
              },
            ]}
          >
            <Text style={{ color: theme.colors.textPrimary }}>{region}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 24 }}>
        <Button label="Save" onPress={handleSave} disabled={!selected} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
