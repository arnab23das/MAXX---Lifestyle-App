// Modular Track -> Path -> Level content model (spec §2, §4, §12 phase 1).
// New goal tracks (Track 2, Track 3) are added by inserting data that
// satisfies these types — never by branching app code per track.

export type LevelType = 'lesson' | 'exercise' | 'documentation';

export type TrackId = 'addictions' | 'track_2' | 'track_3';

/** A top-level goal a user can pick on the Goal Selection screen. */
export interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  available: boolean; // only `addictions` is true in this build
  icon: string; // name used with the icon component
}

/** A category within a track's personalization checklist, e.g. "Vaping". */
export interface HabitCategory {
  id: string;
  trackId: TrackId;
  label: string;
  description: string;
  icon: string;
  isCustom?: boolean; // true for user-authored "Other" entries
}

/** One card of a Lesson level. */
export interface LessonCard {
  id: string;
  heading: string;
  body: string;
}

export interface LessonContent {
  type: 'lesson';
  cards: LessonCard[];
  checkQuestion?: {
    prompt: string;
    options: string[];
    correctIndex: number;
  };
}

export type ExerciseStep =
  | { kind: 'text'; id: string; prompt: string; durationSeconds?: number }
  | { kind: 'breathing'; id: string; prompt: string; inhaleSeconds: number; holdSeconds: number; exhaleSeconds: number; cycles: number }
  | { kind: 'choice'; id: string; prompt: string; options: string[] };

export interface ExerciseContent {
  type: 'exercise';
  intro: string;
  steps: ExerciseStep[];
}

export interface DocumentationPrompt {
  id: string;
  label: string;
  kind: 'mood_scale' | 'craving_scale' | 'free_text' | 'win_tag_multiselect';
  options?: string[];
}

export interface DocumentationContent {
  type: 'documentation';
  intro: string;
  prompts: DocumentationPrompt[];
}

export type LevelContent = LessonContent | ExerciseContent | DocumentationContent;

export interface Level {
  id: string;
  trackId: TrackId;
  categoryIds: string[]; // which HabitCategory selections surface this level
  order: number; // sequence position within the generated path
  type: LevelType;
  title: string;
  estimatedMinutes: number;
  xpReward: number;
  creditReward: number;
  content: LevelContent;
}

/** A user's generated path: an ordered slice of Levels for their selected categories. */
export interface GeneratedPath {
  trackId: TrackId;
  categoryIds: string[];
  levelIds: string[]; // ordered
}
