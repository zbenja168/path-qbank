export interface AnswerRecord {
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  timeSpentMs: number;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  questionIds: string[];
  score: number;
  total: number;
  topicIds: string[];
}

export interface ProgressData {
  version: 1;
  answers: Record<string, AnswerRecord>;
  sessions: Session[];
  bookmarkedQuestions: string[];
  lastTopicFilter: string[];
}

export const DEFAULT_PROGRESS: ProgressData = {
  version: 1,
  answers: {},
  sessions: [],
  bookmarkedQuestions: [],
  lastTopicFilter: [],
};
