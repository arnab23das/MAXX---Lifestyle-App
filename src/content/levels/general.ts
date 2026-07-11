import { Level } from '@/types/content';

// Fallback content used for custom ("Other") habit entries, where we can't
// pre-write content tailored to a free-text label. Generic but genuinely
// useful habit-change fundamentals.
export function buildGeneralLevels(categoryId: string, categoryLabel: string): Level[] {
  const categoryIds = [categoryId];
  return [
    {
      id: `${categoryId}_l1`,
      trackId: 'addictions',
      categoryIds,
      order: 1,
      type: 'lesson',
      title: `Understanding your ${categoryLabel.toLowerCase()} habit`,
      estimatedMinutes: 5,
      xpReward: 20,
      creditReward: 1,
      content: {
        type: 'lesson',
        cards: [
          {
            id: 'c1',
            heading: 'Habits are loops',
            body: 'Every habit runs on a cue, a routine, and a reward. Understanding what triggers yours — and what it gives you — is the fastest way to start changing it.',
          },
          {
            id: 'c2',
            heading: 'Small changes compound',
            body: 'You don’t need a dramatic overhaul on day one. A slightly better choice, repeated consistently, beats a perfect plan you abandon after a week.',
          },
          {
            id: 'c3',
            heading: 'Progress isn’t linear',
            body: 'Setbacks are part of the process, not proof it isn’t working. What matters is getting back on track quickly.',
          },
        ],
      },
    },
    {
      id: `${categoryId}_l2`,
      trackId: 'addictions',
      categoryIds,
      order: 2,
      type: 'exercise',
      title: 'Pause and reset',
      estimatedMinutes: 5,
      xpReward: 25,
      creditReward: 1,
      content: {
        type: 'exercise',
        intro: 'A short reset for the moment the urge shows up.',
        steps: [
          { kind: 'text', id: 's1', prompt: 'Notice the urge without judging it. Just name it.', durationSeconds: 15 },
          { kind: 'breathing', id: 's2', prompt: 'Slow your breathing to break the autopilot.', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6, cycles: 4 },
          { kind: 'choice', id: 's3', prompt: 'Pick one thing to do instead, right now:', options: ['Change your environment', 'Text someone', 'Do a 2-minute task', 'Wait 10 minutes, then decide'] },
        ],
      },
    },
    {
      id: `${categoryId}_l3`,
      trackId: 'addictions',
      categoryIds,
      order: 3,
      type: 'documentation',
      title: 'Check in on today',
      estimatedMinutes: 5,
      xpReward: 20,
      creditReward: 1,
      content: {
        type: 'documentation',
        intro: 'A quick, honest log — private unless you choose to share it.',
        prompts: [
          { id: 'p1', label: 'How are you feeling today?', kind: 'mood_scale' },
          { id: 'p2', label: 'How strong were your urges today?', kind: 'craving_scale' },
          { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Caught myself and paused', 'Used a replacement activity', 'Reached out for support', 'Stuck to my plan'] },
          { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
        ],
      },
    },
  ];
}
