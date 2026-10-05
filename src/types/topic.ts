export interface Topic {
  id: string;
  name: string;
  sourceFile: string;
  questionCount: number;
  /** The brick's original 12. Absent on data assembled before the split. */
  coreCount?: number;
  /** The extension-pass questions, offered as an opt-in on top of the core. */
  extraCount?: number;
}

export interface Category {
  id: string;
  name: string;
  /** Teaching week this category belongs to; the picker groups by it. */
  week?: number;
  weekName?: string;
  weekSubtitle?: string;
  topics: Topic[];
}

export interface TopicsIndex {
  categories: Category[];
  totalQuestions: number;
}
