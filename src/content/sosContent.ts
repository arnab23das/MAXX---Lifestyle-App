// SOS screen content (spec §7): affirmations shown immediately, then
// craving-specific quick actions. Not category-exhaustive by design — these
// are meant to be usable in the middle of any craving, regardless of habit.

export const SOS_AFFIRMATIONS: string[] = [
  'This feeling is temporary. It will pass, whether or not you act on it.',
  'You’ve gotten through hard moments before. You have what it takes to get through this one too.',
  'Needing help right now isn’t weakness — it’s exactly what strength looks like.',
  'One craving doesn’t undo your progress. You’re still on your path.',
  'You don’t have to fight this alone. Support is one tap away.',
];

export interface SosExercise {
  id: string;
  label: string;
  description: string;
  kind: 'breathing' | 'distraction' | 'swap';
  breathing?: { inhaleSeconds: number; holdSeconds: number; exhaleSeconds: number; cycles: number };
}

export const SOS_EXERCISES: SosExercise[] = [
  {
    id: 'box_breathing',
    label: '60-second breathing reset',
    description: 'Slow, guided breathing to calm your body’s stress response right now.',
    kind: 'breathing',
    breathing: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4, cycles: 6 },
  },
  {
    id: 'five_senses',
    label: '5-4-3-2-1 grounding',
    description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    kind: 'distraction',
  },
  {
    id: 'move',
    label: 'Change your environment',
    description: 'Get up, step outside, or move to a different room. A change of scene interrupts the urge.',
    kind: 'distraction',
  },
  {
    id: 'swap',
    label: 'Reach for your swap',
    description: 'Water, gum, a healthy snack, a stress ball — whatever you identified in your levels as your go-to.',
    kind: 'swap',
  },
];
