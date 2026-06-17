export interface Lesson {
  id: string;
  title: string;
  summary: string;
  durationMin: number;
  videoUrl?: string;
}

export interface TrainingLevel {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  lessons: Lesson[];
}

export const TRAINING_LEVELS: TrainingLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'The foundations — building trust, comfort, and a gentle daily rhythm.',
    lessons: [
      {
        id: 'b1',
        title: 'Welcoming an elder into care',
        summary: 'First visits, first words, and how to leave someone feeling at ease.',
        durationMin: 12,
      },
      {
        id: 'b2',
        title: 'Listening with patience',
        summary: 'The most underrated skill in care — and how to practise it.',
        durationMin: 10,
      },
      {
        id: 'b3',
        title: 'Daily routines and their rhythm',
        summary: 'Why predictability is comfort — and how to build a calm day together.',
        durationMin: 14,
      },
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Practical care skills — mobility, medication reminders, and nourishment.',
    lessons: [
      {
        id: 'i1',
        title: 'Safe mobility assistance',
        summary: 'Helping someone stand, walk, and transfer without losing their dignity.',
        durationMin: 18,
      },
      {
        id: 'i2',
        title: 'Medication reminders without anxiety',
        summary: 'How to prompt gently, when to escalate, and what to track.',
        durationMin: 15,
      },
      {
        id: 'i3',
        title: 'Preparing nourishing meals',
        summary: 'Cooking around dietary needs — and around long-held tastes.',
        durationMin: 16,
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Complex care — dementia, recovery, and the emotional weight of the work.',
    lessons: [
      {
        id: 'a1',
        title: 'Caring for someone with dementia',
        summary: 'Reorienting with grace, defusing distress, and meeting people where they are.',
        durationMin: 22,
      },
      {
        id: 'a2',
        title: 'Post-surgery recovery support',
        summary: 'Pacing recovery, watching for signs, and partnering with medical teams.',
        durationMin: 20,
      },
      {
        id: 'a3',
        title: 'When grief enters the home',
        summary: 'How to be a steady presence when a family is in mourning.',
        durationMin: 18,
      },
    ],
  },
];

export const ALL_LESSON_IDS = TRAINING_LEVELS.flatMap(l => l.lessons.map(x => x.id));

export function isLevelComplete(level: TrainingLevel, completed: string[]): boolean {
  return level.lessons.every(l => completed.includes(l.id));
}

export function isAllTrainingComplete(completed: string[]): boolean {
  return TRAINING_LEVELS.every(level => isLevelComplete(level, completed));
}

export function trainingPercent(completed: string[]): number {
  if (ALL_LESSON_IDS.length === 0) return 0;
  const hit = completed.filter(id => ALL_LESSON_IDS.includes(id)).length;
  return Math.round((hit / ALL_LESSON_IDS.length) * 100);
}
