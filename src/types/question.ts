export interface Choice {
  label: string;
  text: string;
}

export interface Explanation {
  summary: string;
  whyCorrect: string;
  whyWrongByChoice: Record<string, string>;
}

export interface Question {
  id: string;
  topicId: string;
  topicName: string;
  stem: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: Explanation;
  difficulty: 'medium' | 'hard';
  /** 'core' = one of the brick's original 12; 'extra' = extension pass. */
  tier?: 'core' | 'extra';
  imageRef: string | null;
  tags: string[];
}

export interface CategoryQuestions {
  categoryId: string;
  categoryName: string;
  questions: Question[];
}
