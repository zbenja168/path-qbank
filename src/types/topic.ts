export interface Topic {
  id: string;
  name: string;
  sourceFile: string;
  questionCount: number;
  /** The brick's original 12. Absent on data assembled before the split. */
  coreCount?: number;
  /** The extension-pass questions, offered as an opt-in on top of the core. */
  extraCount?: number;
  /** High-yield questions across the whole topic, and within the core alone
   *  (what a visitor who is not signed in can be served). */
  hyCount?: number;
  hyCoreCount?: number;
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
