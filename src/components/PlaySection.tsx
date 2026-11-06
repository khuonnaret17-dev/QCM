import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Shuffle,
  Layers,
  Search,
  Eye,
  Play,
  FileText,
  CheckCircle2,
  HelpCircle,
  Download,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Question, Subject, UserSession } from '../types';
import { toKhmerNum, khmerAlphabetSort, shuffleArray, getOptionLabel, fixClonedDocColors } from '../utils/khmer';

interface PlaySectionProps {
  questions: Question[];
  subjects: Subject[];
  session: UserSession;
  onStartQuiz: (quizQuestions: Question[], title: string) => void;
}

export const PlaySection: React.FC<PlaySectionProps> = ({
  questions,
  subjects,
  session,
  onStartQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'subject' | 'mixed' | 'dictionary'>('subject');

  // Filter for subject view
  const [typeFilter, setTypeFilter] = useState<'all' | 'mcq' | 'short' | 'explanation'>('all');

  // Part selection modal
  const [selectedSubjectForParts, setSelectedSubjectForParts] = useState<Subject | null>(null);

  // View Paper modal
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);

  // Mixed mode state
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [mixedCount, setMixedCount] = useState<number>(10);

  // Dictionary search
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWords, setExpandedWords] = useState<Record<string, boolean>>({});

  // Filter active subjects
  const activeSubjects = useMemo(() => {
    return subjects.filter((s) => s.isActive !== false);
  }, [subjects]);

  // Map questions by subject name
  const questionsBySubject = useMemo(() => {
    const map: Record<string, Question[]> = {};
    for (const q of questions) {
      if (q.isActive === false) continue;
      if (!map[q.subject]) {
        map[q.subject] = [];
      }
      map[q.subject].push(q);
    }
    return map;
  }, [questions]);

  // Dictionary words (Type === 'explanation')
  const dictionaryWords = useMemo(() => {
    const list = questions.filter((q) => q.type === 'explanation');
    const sorted = [...list].sort((a, b) => khmerAlphabetSort(a.question, b.question));
    if (!searchTerm.trim()) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(
      (item) =>
        item.question.toLowerCase().includes(term) ||
        (item.answer && item.answer.toLowerCase().includes(term))
    );
  }, [questions, searchTerm]);

  // Toggle accordion item
  const toggleWordExpand = (id: string) => {
    setExpandedWords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle Start Subject Quiz (divide into 10-question parts)
  const handleOpenPartsModal = (subject: Subject) => {
    setSelectedSubjectForParts(subject);
  };

  const handleStartPart = (subject: Subject, partIndex: number) => {
    const allSubjectQuestions = questionsBySubject[subject.name] || [];
    const startIndex = partIndex * 10;
    const partQuestions = allSubjectQuestions.slice(startIndex, startIndex + 10);
    if (partQuestions.length === 0) return;

    setSelectedSubjectForParts(null);
    onStartQuiz(partQuestions, `${subject.name} (ភាគ ${toKhmerNum(partIndex + 1)})`);
  };

  // Mixed mode toggles
  const handleToggleSubjectSelect = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(activeSubjects.map((s) => s.id));
  };

  const handleClearAllSubjects = () => {
    setSelectedSubjectIds([]);
  };

  // Start Mixed Quiz
  const handleStartMixedQuiz = () => {
    const validSubjectNames = activeSubjects
      .filter((s) => selectedSubjectIds.includes(s.id))
      .map((s) => s.name);

    let pool: Question[] = [];
    if (validSubjectNames.length === 0) {
      pool = questions.filter((q) => q.isActive !== false);
    } else {
      pool = questions.filter((q) => q.isActive !== false && validSubjectNames.includes(q.subject));
    }

    if (pool.length === 0) return;

    const shuffled = shuffleArray(pool);
    const selected = shuffled.slice(0, Math.min(mixedCount, shuffled.length));
    onStartQuiz(selected, `វិញ្ញាសាចម្រុះ (${toKhmerNum(selected.length)} សំណួរ)`);
  };

  // Download PDF via html2pdf
  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-paper-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${viewingSubject?.name || 'Vinyasa'}_Master_Quiz.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, onclone: fixClonedDocColors },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    if ((window as any).html2pdf) {
      (window as any).html2pdf().from(element).set(opt).save();
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Top Hero / Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-3">
              ប្រព័ន្ធត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋ
            </span>
            <h1 className="font-moul text-xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 mb-2">
              វិញ្ញាសា និងតេស្តសមត្ថភាព
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-kantumruy leading-relaxed">
              ជ្រើសរើសមុខវិជ្ជាដើម្បីហ្វឹកហាត់តាមភាគ (១ភាគ = ១០សំណួរ) ឬសាកល្បងសមត្ថភាពជាមួយការប្រឡងចម្រុះគ្រប់មុខវិជ្ជា។
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur">
              <span className="block text-xl sm:text-2xl font-bold text-amber-400 font-moul">
                {toKhmerNum(questions.length)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">សំណួរសរុប</span>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur">
              <span className="block text-xl sm:text-2xl font-bold text-cyan-400 font-moul">
                {toKhmerNum(activeSubjects.length)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">មុខវិជ្ជា</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-xl mx-auto shadow-lg">
        <button
          onClick={() => setActiveTab('subject')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
            activeTab === 'subject'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>តាមមុខវិជ្ជា</span>
        </button>

        <button
          onClick={() => setActiveTab('mixed')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
            activeTab === 'mixed'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>តេស្តចម្រុះ</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
            activeTab === 'dictionary'
              ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ពន្យល់ពាក្យ</span>
        </button>
      </div>

      {/* TAB 1: BY SUBJECT */}
      {activeTab === 'subject' && (
        <div className="space-y-6">
          {/* Sub-filters for question types */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-400 mr-1">ប្រភេទ៖</span>
            {[
              { id: 'all', label: 'ទាំងអស់' },
              { id: 'mcq', label: '📑 QCM (ពហុជម្រើស)' },
              { id: 'short', label: '🖊️ Q & A (ខ្លី)' },
              { id: 'explanation', label: '📖 ពន្យល់ពាក្យ' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  typeFilter === f.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSubjects
              .filter((sub) => typeFilter === 'all' || sub.type === typeFilter)
              .map((sub) => {
                const count = (questionsBySubject[sub.name] || []).length;
                const partsCount = Math.ceil(count / 10);

                return (
                  <div
                    key={sub.id}
                    className="relative group rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10"
                  >
                    <div>
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.type === 'mcq'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                              : sub.type === 'short'
                              ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                              : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {sub.type === 'mcq' ? '📑 QCM' : sub.type === 'short' ? '🖊️ Q & A' : '📖 ពន្យល់ពាក្យ'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {toKhmerNum(count)} សំណួរ
                        </span>
                      </div>

                      <h3 className="font-moul text-base text-slate-100 group-hover:text-amber-300 transition-colors mb-2 leading-relaxed">
                        {sub.name}
                      </h3>

                      <p className="text-xs text-slate-400 mb-6 font-kantumruy">
                        បែងចែកជា {toKhmerNum(partsCount || 1)} ភាគ (១ភាគ = ១០សំណួរ) ងាយស្រួលអនុវត្ត
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenPartsModal(sub)}
                        disabled={count === 0}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>ចូលធ្វើតេស្ត</span>
                      </button>

                      <button
                        onClick={() => setViewingSubject(sub)}
                        disabled={count === 0}
                        title="មើលវិញ្ញាសាទាំងមូល"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: MIXED MODE */}
      {activeTab === 'mixed' && (
        <div className="bg-slate-900/90 rounded-3xl border border-purple-500/30 p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-lg">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-moul text-lg sm:text-xl text-purple-300">
                ការធ្វើតេស្តចម្រុះមុខវិជ្ជា (Mixed Mode)
              </h2>
              <p className="text-xs text-slate-400">
                ជ្រើសរើសមុខវិជ្ជាជាច្រើនបញ្ចូលគ្នាដើម្បីបង្កើតវិញ្ញាសាចៃដន្យដូចការប្រឡងពិតប្រាកដ
              </p>
            </div>
          </div>

          {/* Select subjects */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                ជ្រើសរើសមុខវិជ្ជា៖
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSubjects}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  ជ្រើសរើសទាំងអស់
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleClearAllSubjects}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  ដកចេញទាំងអស់
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {activeSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub.id);
                const count = (questionsBySubject[sub.name] || []).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleToggleSubjectSelect(sub.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0"
                      />
                      <span className="text-xs font-medium">{sub.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({toKhmerNum(count)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choose count */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              ចំនួនសំណួរចៃដន្យ៖
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[10, 20, 30, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMixedCount(num)}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center ${
                    mixedCount === num
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span className="font-moul">{toKhmerNum(num)}</span>
                  <span className="text-[10px] font-normal opacity-80">សំណួរ</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartMixedQuiz}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition"
          >
            <Shuffle className="w-5 h-5" />
            <span>ចាប់ផ្ដើមតេស្តចម្រុះ ({toKhmerNum(mixedCount)} សំណួរ)</span>
          </button>
        </div>
      )}

      {/* TAB 3: DICTIONARY / EXPLANATION */}
      {activeTab === 'dictionary' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ស្វែងរកពាក្យគន្លឹះ ឬអត្ថន័យច្បាប់/រដ្ឋបាល..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 transition shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              រកឃើញចំនួន <strong className="text-rose-400 font-bold">{toKhmerNum(dictionaryWords.length)}</strong> ពាក្យ
            </span>
            <span>រៀបតាមលំដាប់អក្ខរក្រមខ្មែរ (A-Z)</span>
          </div>

          {/* Dictionary Accordion List */}
          <div className="space-y-3">
            {dictionaryWords.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">មិនមានពាក្យដែលអ្នកស្វែងរកទេ!</p>
              </div>
            ) : (
              dictionaryWords.map((item, index) => {
                const id = item.id || `dict-${index}`;
                const isExpanded = expandedWords[id] ?? false;

                return (
                  <div
                    key={id}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all shadow-md"
                  >
                    <button
                      onClick={() => toggleWordExpand(id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 font-moul text-xs flex items-center justify-center shrink-0">
                          {toKhmerNum(index + 1)}
                        </span>
                        <span className="font-moul text-sm sm:text-base text-slate-100">
                          {item.question}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {isExpanded ? 'បិទ' : 'ពន្យល់'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-rose-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-4 bg-[#1f0a0a]/50 border-t border-rose-950 text-[#fca5a5] font-siemreap text-sm sm:text-base leading-relaxed tracking-wide">
                        <div className="p-4 rounded-xl bg-[#800000]/25 border border-red-900/40">
                          {item.answer || 'មិនទាន់មានការបកស្រាយលម្អិត។'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: SELECT PART (១ភាគ = ១០សំណួរ) */}
      {selectedSubjectForParts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedSubjectForParts(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                ជ្រើសរើសភាគដើម្បីចាប់ផ្ដើម
              </span>
              <h3 className="font-moul text-lg sm:text-xl text-amber-200 mt-1">
                {selectedSubjectForParts.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                សរុប {toKhmerNum((questionsBySubject[selectedSubjectForParts.name] || []).length)} សំណួរ (១ភាគ = ១០សំណួរ)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {Array.from({
                length: Math.ceil(
                  (questionsBySubject[selectedSubjectForParts.name] || []).length / 10
                ),
              }).map((_, idx) => {
                const countInPart = Math.min(
                  10,
                  (questionsBySubject[selectedSubjectForParts.name] || []).length - idx * 10
                );

                return (
                  <button
                    key={idx}
                    onClick={() => handleStartPart(selectedSubjectForParts, idx)}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-400 flex flex-col items-center justify-center transition group shadow-md"
                  >
                    <span className="font-moul text-sm group-hover:scale-105 transition-transform">
                      ភាគ {toKhmerNum(idx + 1)}
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-900 mt-1">
                      {toKhmerNum(idx * 10 + 1)} - {toKhmerNum(idx * 10 + countInPart)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL PAPER (វិញ្ញាសាទាំងមូល & EXPORT PDF) */}
      {viewingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  កម្រងវិញ្ញាសាពេញលេញ
                </span>
                <h3 className="font-moul text-base sm:text-xl text-slate-100">
                  {viewingSubject.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* PDF Download Button (Available for Admin per prompt) */}
                {session.role === 'admin' && (
                  <button
                    onClick={handleDownloadPDF}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ទាញយកជា PDF (A4)</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingSubject(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Printable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6" id="printable-paper-content">
              {/* Official Header for PDF */}
              <div className="text-center pb-4 border-b border-slate-700 text-slate-900 print:text-black">
                <p className="font-moul text-sm sm:text-base text-amber-400">ព្រះរាជាណាចក្រកម្ពុជា</p>
                <p className="font-siemreap text-xs text-amber-300">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                <h2 className="font-moul text-base sm:text-lg text-slate-100 mt-2">
                  វិញ្ញាសា៖ {viewingSubject.name}
                </h2>
              </div>

              {(questionsBySubject[viewingSubject.name] || []).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="font-moul text-amber-400 text-xs mt-0.5">
                      {toKhmerNum(idx + 1)}.
                    </span>
                    <p className="font-kantumruy font-medium text-sm text-slate-200">
                      {q.question}
                    </p>
                  </div>

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-6">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correct;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg text-xs font-medium ${
                              isCorrect
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-bold mr-1.5">
                              {getOptionLabel(oIdx, q.subject)}.
                            </span>
                            <span>{opt.replace(/^[ក-ឃA-D]\.\s*/, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(q.type === 'short' || q.type === 'explanation') && q.answer && (
                    <div className="mt-3 pl-6 text-xs text-[#fca5a5] bg-[#800000]/25 p-3 rounded-lg border border-red-900/40 font-siemreap leading-relaxed">
                      <strong>ចម្លើយបកស្រាយ៖</strong> {q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
