import { Level } from '@/types/content';

const categoryIds = ['doomscrolling'];

export const DOOMSCROLLING_LEVELS: Level[] = [
  {
    id: 'doomscrolling_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'Why your brain won’t let go',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'It’s built to be unfinishable',
          body: 'Short-form feeds have no end screen. Every swipe is a tiny gamble on a better next video, and your brain releases a hit of dopamine on the possibility — not just the payoff. That’s why "just five more minutes" rarely is.',
        },
        {
          id: 'c2',
          heading: 'Variable rewards are the hook',
          body: 'Slot machines and social feeds use the same trick: unpredictable rewards keep you checking far more than predictable ones would. It’s not a lack of willpower — it’s a well-designed loop.',
        },
        {
          id: 'c3',
          heading: 'The cost is attention, not just time',
          body: 'Heavy short-form use is linked to shorter attention spans, worse sleep, and a nagging, wired-but-tired feeling. Cutting back isn’t about guilt — it’s about getting your focus back.',
        },
      ],
      checkQuestion: {
        prompt: 'What makes short-form feeds so hard to put down?',
        options: [
          'They have a natural stopping point',
          'Unpredictable rewards keep your brain checking for more',
          'They require a lot of active decision-making',
        ],
        correctIndex: 1,
      },
    },
  },
  {
    id: 'doomscrolling_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'Ayo, pause',
    estimatedMinutes: 5,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A quick pattern-interrupt for the moment you notice yourself mindlessly scrolling.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Notice the urge without judging it. Just name it: "I want to scroll."', durationSeconds: 15 },
        { kind: 'breathing', id: 's2', prompt: 'Take 4 slow breaths to break the autopilot.', inhaleSeconds: 4, holdSeconds: 2, exhaleSeconds: 4, cycles: 4 },
        { kind: 'choice', id: 's3', prompt: 'Pick one thing to do instead, right now:', options: ['Stand up and stretch', 'Text a friend something real', 'Look out a window for 30 seconds', 'Put the phone in another room'] },
      ],
    },
  },
  {
    id: 'doomscrolling_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Design your phone, don’t let it design you',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Friction works',
          body: 'Log out of apps after each use, move them off your home screen, or use grayscale mode. Small friction reduces automatic, mindless opens — you still have a choice, but it’s no longer instant.',
        },
        {
          id: 'c2',
          heading: 'Replace, don’t just remove',
          body: 'Willpower fades by evening. Have a specific replacement ready — a book, a playlist, a call to a friend — for the exact moments you’d normally reach for the feed.',
        },
        {
          id: 'c3',
          heading: 'Protect one dead zone',
          body: 'Pick one recurring moment — the first 30 minutes after waking, or the hour before bed — and make it a no-scroll zone. Consistency in one small window builds the habit faster than a total ban.',
        },
      ],
    },
  },
  {
    id: 'doomscrolling_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Build your dead-zone plan',
    estimatedMinutes: 8,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Pick the window you’ll protect and what you’ll do instead.',
      steps: [
        { kind: 'choice', id: 's1', prompt: 'Which window will you protect first?', options: ['First 30 min after waking', 'During meals', 'Last hour before bed', 'Commute / transit time'] },
        { kind: 'choice', id: 's2', prompt: 'What will you reach for instead?', options: ['A physical book', 'Music or a podcast', 'Journaling', 'Talking to someone nearby'] },
        { kind: 'text', id: 's3', prompt: 'Say your plan out loud once: "During [window], instead of scrolling, I will [replacement]."', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'doomscrolling_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Check in on your screen habits',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'A quick, honest log of how today went. This is just for you unless you choose to share it.',
      prompts: [
        { id: 'p1', label: 'How did you feel about your phone use today?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong was the urge to scroll mindlessly?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Protected my dead zone', 'Caught myself and paused', 'Used a replacement activity', 'Slept better'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
