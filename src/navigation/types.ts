import { TrackId } from '@/types/content';

export type OnboardingStackParamList = {
  GoalSelection: undefined;
  PersonalizationChecklist: { trackId: TrackId };
  SignUp: { trackId: TrackId; categoryIds: string[]; customLabels: string[] };
  SignIn: undefined;
};

export type MainTabParamList = {
  PathTab: undefined;
  CommunityTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
  LevelDetail: { levelId: string };
  Sos: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  AccountDeletion: undefined;
  BlockedUsers: undefined;
  RegionPicker: undefined;
  WidgetInfo: undefined;
};
