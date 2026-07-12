import { Level } from '@/types/content';

// Fallback content used for custom ("Other") habit entries, where we can't
// pre-write a full 5-chapter path tailored to free-text the user typed in.
// A short, generic-but-useful 3-level starter instead of the full 30-level
// structure the fixed categories get.
export function buildGeneralLevels(categoryId: string, categoryLabel: string): Level[] {
  const categoryIds = [categoryId];
  return [
    {
      id: `${categoryId}_awareness_01`,
      trackId: 'addictions',
      categoryIds,
      chapter: 'awareness',
      levelNumber: 1,
      order: 1,
      type: 'lesson',
      title: `Understanding your ${categoryLabel.toLowerCase()} habit`,
      estimatedMinutes: 4,
      xpReward: 20,
      creditReward: 1,
      content: {
        type: 'lesson',
        lessonText:
          'Every habit runs on a cue, a routine, and a reward. Understanding what triggers yours — and what it gives you — is the fastest way to start changing it. Small, consistent changes beat a perfect plan you abandon after a week.',
        questions: [
          {
            prompt: 'What tends to work better than a dramatic overhaul?',
            options: ['A perfect plan followed for one day', 'A slightly better choice, repeated consistently', 'Waiting for motivation to strike'],
            correctIndex: 1,
            feedbackCorrect: 'Right — small, repeatable changes compound over time.',
            feedbackIncorrect: 'Not quite. Small, consistent changes tend to stick better than an all-or-nothing overhaul.',
          },
        ],
      },
    },
    {
      id: `${categoryId}_awareness_02`,
      trackId: 'addictions',
      categoryIds,
      chapter: 'awareness',
      levelNumber: 2,
      order: 2,
      type: 'exercise',
      title: 'Pause and reset',
      estimatedMinutes: 3,
      xpReward: 25,
      creditReward: 1,
      content: {
        type: 'exercise',
        instruction:
          'The next time the urge shows up, pause. Name it silently ("I want to ___") without judging it, then take four slow breaths before deciding what to do next.',
        format: 'breathing_timer',
        durationSeconds: 60,
        completionPrompt: 'How strong is the urge now, from 1 (gone) to 5 (still strong)?',
      },
    },
    {
      id: `${categoryId}_awareness_03`,
      trackId: 'addictions',
      categoryIds,
      chapter: 'awareness',
      levelNumber: 3,
      order: 3,
      type: 'documentation',
      title: 'Check in on today',
      estimatedMinutes: 3,
      xpReward: 15,
      creditReward: 1,
      content: {
        type: 'documentation',
        checkInPrompt: 'A quick, honest log — private unless you choose to share it.',
        fields: [
          { key: 'mood', label: 'How are you feeling today?', input: 'scale_1_5' },
          { key: 'urge', label: 'How strong were your urges today?', input: 'scale_1_5' },
          { key: 'notes', label: 'Anything else on your mind?', input: 'long_text' },
        ],
        shareableToCommunity: true,
      },
    },
  ];
}
