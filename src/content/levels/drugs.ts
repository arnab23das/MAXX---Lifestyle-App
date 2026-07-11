import { Level } from '@/types/content';

const categoryIds = ['drugs'];

export const DRUGS_LEVELS: Level[] = [
  {
    id: 'drugs_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'Understanding use, not judging it',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Use often starts as coping',
          body: 'Substance use frequently begins as a way to manage stress, pain, boredom, or difficult emotions. Understanding what it’s doing for you is more useful than judging yourself for needing it.',
        },
        {
          id: 'c2',
          heading: 'You’re not alone, and support helps',
          body: 'People who combine self-directed tools like this with outside support — friends, groups, or professional treatment — tend to have the most durable results. This app is a companion, not a replacement for that support.',
        },
        {
          id: 'c3',
          heading: 'Withdrawal can be serious',
          body: 'Depending on the substance, stopping suddenly can carry real medical risk. If you’re a regular, heavy user of alcohol, benzodiazepines, or opioids, talk to a doctor before stopping abruptly.',
        },
      ],
      checkQuestion: {
        prompt: 'What does the research suggest works best for lasting change?',
        options: ['Doing it completely alone', 'Combining self-help tools with outside support', 'Avoiding all professional help'],
        correctIndex: 1,
      },
    },
  },
  {
    id: 'drugs_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'Urge surfing',
    estimatedMinutes: 7,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A grounding exercise for riding out an urge without acting on it.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Name where you feel the urge in your body — chest, stomach, hands.', durationSeconds: 15 },
        { kind: 'breathing', id: 's2', prompt: 'Breathe slowly and imagine the urge as a wave that will crest and fall.', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6, cycles: 5 },
        { kind: 'choice', id: 's3', prompt: 'Choose a next step:', options: ['Call or text a support person', 'Change your physical location', 'Use a grounding technique (5 things you see)', 'Use your emergency contacts / SOS'] },
      ],
    },
  },
  {
    id: 'drugs_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Know your people, places, and things',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Environment shapes behavior',
          body: 'Certain people, places, and routines are strongly linked to use. Identifying yours — without shame — makes it possible to plan around them.',
        },
        {
          id: 'c2',
          heading: 'Build a support bench',
          body: 'Having 2-3 people you can reach out to in a hard moment, before you need them, makes a real difference. This app’s SOS feature can help you organize that list.',
        },
        {
          id: 'c3',
          heading: 'Professional support is a strength, not a failure',
          body: 'Therapists, doctors, and support groups (like SMART Recovery or 12-step programs) exist because recovery is hard to do entirely alone. Using them is a sign of strategy, not weakness.',
        },
      ],
    },
  },
  {
    id: 'drugs_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Build your support bench',
    estimatedMinutes: 8,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Identify your people and one resource to look into.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Think of 1-2 people you could reach out to in a hard moment. You can add them as emergency contacts in the SOS section.', durationSeconds: 20 },
        { kind: 'choice', id: 's2', prompt: 'Is there a professional resource you’d consider looking into?', options: ['A therapist or counselor', 'A support group (SMART Recovery, 12-step, etc.)', 'My doctor', 'Not right now, but noted'] },
        { kind: 'text', id: 's3', prompt: 'Write down one small next step you can take this week.', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'drugs_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Log today’s progress',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'An honest, private check-in. Share only if and when you choose to.',
      prompts: [
        { id: 'p1', label: 'How are you feeling today?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong were your urges today?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Used urge surfing', 'Reached out to my support bench', 'Avoided a risky situation', 'Looked into professional support'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
