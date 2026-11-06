import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Share2,
  Volume2,
  VolumeX,
  Eye,
  Award,
  Sparkles,
  Download,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { Question, UserAnswerRecord } from '../types';
import {
  toKhmerNum,
  getOptionLabel,
  playCorrectSound,
  playWrongSound,
  playClickSound,
  shuffleArray,
  fixClonedDocColors,
} from '../utils/khmer';

interface QuizGameScreenProps {
  questions: Question[];
  title: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onNextPart?: () => void;
}

export const QuizGameScreen: React.FC<QuizGameScreenProps> = ({
  questions,
  title,
  isMuted,
  onToggleMute,
  onExit,
  onNextPart,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [revealedShortAnswers, setRevealedShortAnswers] = useState<Record<number, boolean>>({});
  const [selfAssessment, setSelfAssessment] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Store randomized options for each question so it doesn't shuffle repeatedly on render
  const randomizedOptionsRef = useRef<
    Record<number, { options: string[]; correctIndex: number }>
  >({});

  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize and shuffle options on start
  useEffect(() => {
    const map: Record<number, { options: string[]; correctIndex: number }> = {};
    questions.forEach((q, idx) => {
      if (q.type === 'mcq' && q.options && q.options.length > 0) {
        const originalCorrectOption = q.options[q.correct ?? 0];
        const shuffled = shuffleArray(q.options.map((opt) => opt.replace(/^[ក-ឃA-D]\.\s*/, '')));
        const newCorrectIndex = shuffled.findIndex((opt) => opt === originalCorrectOption.replace(/^[ក-ឃA-D]\.\s*/, ''));

        map[idx] = {
          options: shuffled,
          correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
        };
      }
    });
    randomizedOptionsRef.current = map;
  }, [questions]);

  const currentQ = questions[currentIndex];
  const qOptionsData = randomizedOptionsRef.current[currentIndex] || {
    options: currentQ?.options || [],
    correctIndex: currentQ?.correct ?? 0,
  };

  // Score calculation
  const totalQuestions = questions.length;
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (q.type === 'mcq') {
      const selected = userAnswers[idx];
      const correctIdx = randomizedOptionsRef.current[idx]?.correctIndex ?? q.correct ?? 0;
      if (selected === correctIdx) correctCount++;
    } else {
      if (selfAssessment[idx]) correctCount++;
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Handle MCQ selection
  const handleSelectOption = (optionIndex: number) => {
    if (userAnswers[currentIndex] !== undefined) return; // Answered already
    playClickSound();

    const isCorrect = optionIndex === qOptionsData.correctIndex;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setUserAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  // Self assessment for short / explanation questions
  const handleMarkSelfAssessment = (correct: boolean) => {
    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    setSelfAssessment((prev) => ({ ...prev, [currentIndex]: correct }));
  };

  // Finish quiz
  const handleFinishQuiz = () => {
    setIsCompleted(true);
    if (percentage >= 50) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // Ignore
      }
    }
  };

  // Retry quiz
  const handleRetry = () => {
    setUserAnswers({});
    setRevealedShortAnswers({});
    setSelfAssessment({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsReviewMode(false);
  };

  // Export current question card as image
  const handleExportCardImage = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0b0f19',
        useCORS: true,
        onclone: fixClonedDocColors,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `MasterQuiz_Q${currentIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting card:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // If completed & not review mode, show Result Summary Screen
  if (isCompleted && !isReviewMode) {
    let medalTitle = 'ខំប្រឹងប្រែងបន្ថែមទៀត!';
    let medalColor = 'text-slate-400';
    let medalBg = 'bg-slate-800 border-slate-700';

    if (percentage >= 90) {
      medalTitle = 'ឆ្នើមឥតខ្ចោះ - កិត្តិយសលេខ១! 🏆';
      medalColor = 'text-amber-300';
      medalBg = 'bg-amber-950/60 border-amber-500/50';
    } else if (percentage >= 75) {
      medalTitle = 'លទ្ធផលល្អប្រសើរណាស់! 🥇';
      medalColor = 'text-emerald-300';
      medalBg = 'bg-emerald-950/60 border-emerald-500/50';
    } else if (percentage >= 50) {
      medalTitle = 'ជាប់កម្រិតមធ្យម! 🥈';
      medalColor = 'text-cyan-300';
      medalBg = 'bg-cyan-950/60 border-cyan-500/50';
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fadeIn">
        <div className="bg-slate-900/90 rounded-3xl border border-amber-500/40 p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
          {/* Confetti decoration circles */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-500/10 rounded-full blur-2xl" />

          {/* Trophy Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30 animate-pulse">
              <Trophy className="w-12 h-12" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-spin-slow" />
          </div>

          <h2 className="font-moul text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mb-2">
            លទ្ធផលការធ្វើតេស្ត
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">{title}</p>

          {/* Score Badge */}
          <div className={`p-4 rounded-2xl border ${medalBg} max-w-sm mx-auto mb-8`}>
            <p className={`font-moul text-base sm:text-lg ${medalColor} mb-2`}>{medalTitle}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-moul text-4xl sm:text-5xl text-white">
                {toKhmerNum(percentage)}
              </span>
              <span className="text-xl text-amber-400 font-bold">%</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-kantumruy">
              ឆ្លើយត្រូវ <strong className="text-emerald-400">{toKhmerNum(correctCount)}</strong> ក្នុងចំណោម{' '}
              <strong>{toKhmerNum(totalQuestions)}</strong> សំណួរ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              onClick={() => setIsReviewMode(true)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>ពិនិត្យចម្លើយឡើងវិញ</span>
            </button>

            <button
              onClick={handleRetry}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ធ្វើតេស្តម្ដងទៀត</span>
            </button>

            {onNextPart && (
              <button
                onClick={onNextPart}
                className="sm:col-span-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>បន្តទៅភាគបន្ទាប់</span>
              </button>
            )}

            <button
              onClick={onExit}
              className="sm:col-span-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white text-xs transition"
            >
              ត្រឡប់ទៅមឺនុយដើម
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Display (Active Play or Review Mode)
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Top Bar: Back, Title, Sound, Live Score */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ចាកចេញ</span>
        </button>

        <div className="text-center truncate px-2">
          <p className="font-moul text-xs sm:text-sm text-amber-300 truncate">{title}</p>
          {isReviewMode && (
            <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
              របៀបពិនិត្យចម្លើយឡើងវិញ
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
            ត្រូវ {toKhmerNum(correctCount)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div
        ref={cardRef}
        className="bg-slate-900/95 rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative"
      >
        {/* Card Header info */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-moul text-xs">
              សំណួរទី {toKhmerNum(currentIndex + 1)} / {toKhmerNum(totalQuestions)}
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
              {currentQ.subject}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportCardImage}
            disabled={isCapturing}
            title="ចែករំលែកប័ណ្ណសំណួរជារូបភាព"
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            <Share2 className="w-3 h-3" />
            <span>{isCapturing ? 'កំពុងបង្កើត...' : 'ប័ណ្ណរូបភាព'}</span>
          </button>
        </div>

        {/* Question Text */}
        <h2 className="font-kantumruy font-semibold text-base sm:text-xl text-slate-100 mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* MCQ Options Rendering */}
        {currentQ.type === 'mcq' && (
          <div className="space-y-3 mb-6">
            {qOptionsData.options.map((option, optIdx) => {
              const selectedIdx = userAnswers[currentIndex];
              const isSelected = selectedIdx === optIdx;
              const isCorrectOpt = optIdx === qOptionsData.correctIndex;
              const hasAnswered = selectedIdx !== undefined;

              let btnStyle =
                'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200';

              if (hasAnswered) {
                if (isCorrectOpt) {
                  btnStyle =
                    'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle =
                    'bg-red-950/80 border-red-500 text-red-200 shadow-md shadow-red-500/20';
                } else {
                  btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      hasAnswered && isCorrectOpt
                        ? 'bg-emerald-500 text-slate-950'
                        : hasAnswered && isSelected && !isCorrectOpt
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {getOptionLabel(optIdx, currentQ.subject)}
                  </span>
                  <span className="font-kantumruy text-sm sm:text-base leading-relaxed flex-1 break-words">
                    {option}
                  </span>
                  {hasAnswered && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* MCQ Reference Document / Explanation */}
        {currentQ.type === 'mcq' && currentQ.answer && (userAnswers[currentIndex] !== undefined || isReviewMode) && (
          <div className="mb-6 p-4 rounded-2xl bg-[#800000]/25 border border-red-900/50 text-[#fca5a5] font-siemreap text-xs sm:text-sm leading-relaxed animate-fadeIn">
            <p className="font-moul text-xs text-amber-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ឯកសារយោង / ការបកស្រាយ៖</span>
            </p>
            <div className="whitespace-pre-line">{currentQ.answer}</div>
          </div>
        )}

        {/* Short & Explanation Type Rendering */}
        {(currentQ.type === 'short' || currentQ.type === 'explanation') && (
          <div className="mb-6 space-y-4">
            {!revealedShortAnswers[currentIndex] ? (
              <button
                type="button"
                onClick={() =>
                  setRevealedShortAnswers((prev) => ({ ...prev, [currentIndex]: true }))
                }
                className="w-full py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Eye className="w-4 h-4" />
                <span>ចុចដើម្បីបង្ហាញចម្លើយបកស្រាយ</span>
              </button>
            ) : (
              <div className="p-5 rounded-2xl bg-[#800000]/25 border border-red-900/50 text-[#fca5a5] font-siemreap text-sm sm:text-base leading-relaxed animate-fadeIn">
                <p className="font-moul text-xs text-amber-300 mb-2">ចម្លើយបកស្រាយផ្លូវការ៖</p>
                <div className="whitespace-pre-line">{currentQ.answer}</div>

                {/* Self assessment buttons */}
                {selfAssessment[currentIndex] === undefined && (
                  <div className="mt-4 pt-3 border-t border-red-900/40 flex items-center justify-between">
                    <span className="text-xs text-slate-300">វាយតម្លៃការយល់ដឹងរបស់អ្នក៖</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkSelfAssessment(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>យល់ច្បាស់ / ត្រូវ</span>
                      </button>
                      <button
                        onClick={() => handleMarkSelfAssessment(false)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>រៀនបន្ថែម</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ថយក្រោយ</span>
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleFinishQuiz}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
            >
              <Award className="w-4 h-4" />
              <span>បញ្ចប់ការធ្វើតេស្ត</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
            >
              <span>សំណួរបន្ទាប់</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
