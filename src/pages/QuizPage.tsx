import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData, AnswerRecord, Session } from '../types/progress';
import { QuestionCard } from '../components/Question/QuestionCard';
import { useTimer } from '../hooks/useTimer';

interface Props {
  questions: Question[];
  progress: ProgressData;
  onRecordAnswer: (questionId: string, record: AnswerRecord) => void;
  onRecordSession: (session: Session) => void;
  onToggleBookmark: (questionId: string) => void;
  onExit: () => void;
  selectedTopicIds: string[];
}

export function QuizPage({
  questions, progress, onRecordAnswer, onRecordSession,
  onToggleBookmark, onExit, selectedTopicIds,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Map<string, string>>(new Map());
  const [sessionStart] = useState(() => new Date().toISOString());
  const timer = useTimer();

  useEffect(() => {
    timer.start();
  }, [currentIndex, timer]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback((choiceLabel: string) => {
    if (!currentQuestion) return;
    const timeSpent = timer.elapsed();
    const isCorrect = choiceLabel === currentQuestion.correctAnswer;

    const record: AnswerRecord = {
      selectedAnswer: choiceLabel,
      isCorrect,
      answeredAt: new Date().toISOString(),
      timeSpentMs: timeSpent,
    };

    onRecordAnswer(currentQuestion.id, record);
    setSessionAnswers(prev => new Map(prev).set(currentQuestion.id, choiceLabel));
  }, [currentQuestion, timer, onRecordAnswer]);

  const handleEnd = useCallback(() => {
    const answered = Array.from(sessionAnswers.entries());
    const correct = answered.filter(([qId]) => {
      const q = questions.find(q => q.id === qId);
      return q && sessionAnswers.get(qId) === q.correctAnswer;
    }).length;

    const session: Session = {
      id: `session-${Date.now()}`,
      startedAt: sessionStart,
      endedAt: new Date().toISOString(),
      questionIds: Array.from(sessionAnswers.keys()),
      score: correct,
      total: answered.length,
      topicIds: selectedTopicIds,
    };

    if (answered.length > 0) {
      onRecordSession(session);
    }
    onExit();
  }, [sessionAnswers, questions, sessionStart, selectedTopicIds, onRecordSession, onExit]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No questions available.</p>
          <button onClick={onExit} className="px-6 py-2 rounded-lg bg-blue-600 text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-100">CV QBank</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {sessionAnswers.size} answered
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          isBookmarked={progress.bookmarkedQuestions.includes(currentQuestion.id)}
          previousAnswer={progress.answers[currentQuestion.id]?.selectedAnswer ?? sessionAnswers.get(currentQuestion.id) ?? undefined}
          onAnswer={handleAnswer}
          onNext={() => setCurrentIndex(i => Math.min(i + 1, questions.length - 1))}
          onPrevious={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          onBookmark={() => onToggleBookmark(currentQuestion.id)}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < questions.length - 1}
          onEnd={handleEnd}
        />
      </main>
    </div>
  );
}
