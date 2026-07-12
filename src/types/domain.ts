import { TrackId } from './content';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  createdAt: string;
  selectedTrackId: TrackId | null;
  selectedCategoryIds: string[];
  region: string | null; // user-selected region powering "local" community (§6)
  acceptedTermsAt: string | null;
  acceptedTermsVersion: string | null;
  notificationsEnabled: boolean;
}

export interface LevelProgress {
  userId: string;
  levelId: string;
  status: 'locked' | 'unlocked' | 'completed';
  completedAt: string | null;
  attempts: number;
}

export interface GamificationState {
  userId: string;
  xp: number;
  credits: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // yyyy-mm-dd
  streakFreezesAvailable: number; // §5 decision: streak-freeze safety net
  streakFreezesUsedTotal: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  levelId: string | null;
  createdAt: string;
  answers: Record<string, string | number>; // keyed by each DocumentationField's `key`
  isShared: boolean; // opt-in per entry (§4, §6, §9)
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorDisplayName: string;
  createdAt: string;
  region: string | null;
  sourceJournalEntryId: string | null;
  text: string;
  affirmationCount: number;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  kind: 'affirmation';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'user' | 'sos_broadcast';
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
  status: 'open' | 'actioned' | 'dismissed';
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedDisplayName: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export interface SosBroadcast {
  id: string;
  userId: string;
  region: string | null;
  createdAt: string;
  message: string | null;
  active: boolean;
}

export interface SosBroadcastReply {
  id: string;
  broadcastId: string;
  authorId: string;
  authorDisplayName: string;
  message: string;
  createdAt: string;
}

export interface CrisisResource {
  region: string;
  label: string;
  phone: string;
  sms?: string;
  description: string;
}
