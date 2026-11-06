import React, { useState } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Download,
  Send,
  Users,
  Sparkles,
  Trash2,
  Edit2,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Question, Subject, LoginRecord, PresenceRecord, Feedback, QuestionType } from '../types';
import { toKhmerNum, getOptionLabel, fixClonedDocColors } from '../utils/khmer';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  swapQuestions,
  addSubject,
  updateSubject,
  deleteSubject,
  broadcastNotification,
} from '../services/firebase';

interface AdminSectionProps {
  questions: Question[];
  subjects: Subject[];
  logins: LoginRecord[];
  presence: PresenceRecord[];
  feedbacks: Feedback[];
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  questions,
  subjects,
  logins,
  presence,
  feedbacks,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'single' | 'bulk_ai' | 'manage' | 'export' | 'telegram' | 'monitoring'
  >('single');

  // Single Question Form State
  const [singleSubject, setSingleSubject] = useState(subjects[0]?.name || 'រដ្ឋបាលទូទៅ និងច្បាប់');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [singleType, setSingleType] = useState<QuestionType>('mcq');
  const [singleQuestionText, setSingleQuestionText] = useState('');
  const [singleOptions, setSingleOptions] = useState<string[]>([
    'ក. ',
    'ខ. ',
    'គ. ',
    'ឃ. ',
  ]);
  const [singleCorrect, setSingleCorrect] = useState<number>(0);
  const [singleAnswer, setSingleAnswer] = useState('');
  const [singleStatusMsg, setSingleStatusMsg] = useState<{ text: string; success: boolean } | null>(
    null
  );

  // Bulk Import & AI Generator State
  const [bulkText, setBulkText] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState(subjects[0]?.name || 'រដ្ឋបាលទូទៅ និងច្បាប់');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiType, setAiType] = useState<QuestionType>('mcq');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<Question[]>([]);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<{ text: string; success: boolean } | null>(
    null
  );

  // Management State
  const [selectedSubjectToManage, setSelectedSubjectToManage] = useState<string>(
    subjects[0]?.name || ''
  );
  const [swapFromIndex, setSwapFromIndex] = useState<number>(1);
  const [swapToIndex, setSwapToIndex] = useState<number>(2);

  // PDF Export Settings
  const [exportTemplate, setExportTemplate] = useState<'classic' | 'royal' | 'vivid'>('royal');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [exportSubject, setExportSubject] = useState<string>(subjects[0]?.name || '');

  // Telegram Bot Settings
  const [tgBotToken, setTgBotToken] = useState(() => {
    return localStorage.getItem('master_quiz_tg_token') || '';
  });
  const [tgChatId, setTgChatId] = useState(() => {
    return localStorage.getItem('master_quiz_tg_chat') || '';
  });
  const [tgSelectedQuestionId, setTgSelectedQuestionId] = useState<string>('');
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ text: string; success: boolean } | null>(
    null
  );

  // Broadcast Notification Form
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning'>('info');

  // Question Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionSubject, setEditQuestionSubject] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionType, setEditQuestionType] = useState<QuestionType>('mcq');
  const [editQuestionOptions, setEditQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [editQuestionCorrect, setEditQuestionCorrect] = useState<number>(0);
  const [editQuestionAnswer, setEditQuestionAnswer] = useState('');

  // Subject Edit Modal State
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectType, setEditSubjectType] = useState<QuestionType>('mcq');
  const [editSubjectIsActive, setEditSubjectIsActive] = useState<boolean>(true);

  // Open & save handlers for editing questions
  const handleOpenEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestionSubject(q.subject || subjects[0]?.name || '');
    setEditQuestionText(q.question || '');
    setEditQuestionType(q.type || 'mcq');
    setEditQuestionOptions(
      q.options && q.options.length === 4
        ? [...q.options]
        : ['ក. ', 'ខ. ', 'គ. ', 'ឃ. ']
    );
    setEditQuestionCorrect(q.correct ?? 0);
    setEditQuestionAnswer(q.answer || '');
  };

  const handleSaveQuestionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.id) return;
    if (!editQuestionText.trim()) return;

    const updates: Partial<Question> = {
      subject: editQuestionSubject,
      question: editQuestionText.trim(),
      type: editQuestionType,
      options: editQuestionType === 'mcq' ? editQuestionOptions.map((o) => o.trim()) : undefined,
      correct: editQuestionType === 'mcq' ? editQuestionCorrect : undefined,
      answer: editQuestionAnswer.trim() || undefined,
    };

    await updateQuestion(editingQuestion.id, updates);
    setEditingQuestion(null);
  };

  // Open & save handlers for editing subjects
  const handleOpenEditSubjectModal = (sub: Subject) => {
    setEditingSubject(sub);
    setEditSubjectName(sub.name);
    setEditSubjectType(sub.type);
    setEditSubjectIsActive(sub.isActive !== false);
  };

  const handleSaveSubjectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.id) return;
    const newName = editSubjectName.trim();
    if (!newName) return;

    const oldName = editingSubject.name;
    await updateSubject(editingSubject.id, {
      name: newName,
      type: editSubjectType,
      isActive: editSubjectIsActive,
    });

    if (oldName !== newName) {
      const matchingQuestions = questions.filter((q) => q.subject === oldName);
      for (const q of matchingQuestions) {
        if (q.id) {
          await updateQuestion(q.id, { subject: newName });
        }
      }
    }

    setEditingSubject(null);
  };

  // Handle Single Entry Submit
  const handleSaveSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleStatusMsg(null);

    const finalSubject = newSubjectName.trim() ? newSubjectName.trim() : singleSubject;
    if (!singleQuestionText.trim()) {
      setSingleStatusMsg({ text: 'សូមបញ្ចូលអត្ថបទសំណួរ!', success: false });
      return;
    }

    try {
      // Check if new subject needs to be added
      if (newSubjectName.trim() && !subjects.some((s) => s.name === newSubjectName.trim())) {
        await addSubject({
          name: newSubjectName.trim(),
          type: singleType,
          isActive: true,
          order: subjects.length + 1,
        });
      }

      await addQuestion({
        subject: finalSubject,
        question: singleQuestionText.trim(),
        type: singleType,
        options: singleType === 'mcq' ? singleOptions.map((o) => o.trim()) : undefined,
        correct: singleType === 'mcq' ? singleCorrect : undefined,
        answer: singleType !== 'mcq' ? singleAnswer.trim() : singleOptions[singleCorrect],
        isActive: true,
        order: questions.filter((q) => q.subject === finalSubject).length + 1,
      });

      setSingleStatusMsg({ text: 'បានបញ្ចូលសំណួរថ្មីជោគជ័យ!', success: true });
      setSingleQuestionText('');
      setSingleAnswer('');
      setSingleOptions(['ក. ', 'ខ. ', 'គ. ', 'ឃ. ']);
      setNewSubjectName('');
    } catch (err: any) {
      setSingleStatusMsg({ text: err.message || 'បរាជ័យក្នុងការបញ្ចូលសំណួរ', success: false });
    }
  };

  // Generate Questions via Gemini AI API
  const handleGenerateAiQuestions = async () => {
    setIsAiGenerating(true);
    setBulkStatusMsg(null);

    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          count: aiCount,
          type: aiType,
          customTopic: aiTopic,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'AI Generation failed');
      }

      setGeneratedPreview(data.questions || []);
      setBulkStatusMsg({
        text: `បានបង្កើត ${toKhmerNum(data.questions.length)} សំណួរជោគជ័យ! សូមពិនិត្យ និងចុចរក្សាទុក`,
        success: true,
      });
    } catch (err: any) {
      setBulkStatusMsg({ text: err.message || 'បរាជ័យក្នុងការដំណើរការ AI', success: false });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save AI Generated Questions to Firestore
  const handleSaveGeneratedQuestions = async () => {
    if (generatedPreview.length === 0) return;
    try {
      for (const q of generatedPreview) {
        await addQuestion(q);
      }
      setBulkStatusMsg({
        text: `បានរក្សាទុក ${toKhmerNum(generatedPreview.length)} សំណួរចូលក្នុង Database ជោគជ័យ!`,
        success: true,
      });
      setGeneratedPreview([]);
    } catch (err: any) {
      setBulkStatusMsg({ text: err.message || 'បរាជ័យក្នុងការរក្សាទុក', success: false });
    }
  };

  // Parse Bulk Text Import
  const handleParseBulkText = async () => {
    if (!bulkText.trim()) return;

    const parsed: Question[] = [];
    // Split by empty lines or lines starting with Latin or Khmer numerals (1. / ១.)
    const blocks = bulkText.split(/\n\s*\n|\n(?=[0-9០-៩]+[\.\)])/);

    for (const block of blocks) {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length >= 2) {
        // Strip question index like 1. / ១. / 1) / ១)
        const qLine = lines[0].replace(/^[0-9០-៩]+[\.\)]\s*/, '').trim();
        const options: string[] = [];
        let correct = 0;
        let answer = '';
        let foundCorrectInOptions = false;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          // Check if line is an Option: starting with ก., ខ., គ., ឃ., A., B., C., D.
          if (/^[A-Da-dក-ឃ][\.\)]\s*/.test(line)) {
            // Check if option line contains inline correct tag: (ចម្លើយត្រឹមត្រូវ), (ចម្លើយត្រូវ), (correct)
            const isCorrectOption = /\((ចម្លើយត្រឹមត្រូវ|ចម្លើយត្រូវ|ចម្លើយត្រូវពិតប្រាកដ|correct|Correct)\)/i.test(line);

            // Clean out the correct tag from option text
            const cleanedOption = line.replace(/\s*\((ចម្លើយត្រឹមត្រូវ|ចម្លើយត្រូវ|ចម្លើយត្រូវពិតប្រាកដ|correct|Correct)\)/gi, '').trim();

            if (isCorrectOption) {
              correct = options.length;
              foundCorrectInOptions = true;
            }

            options.push(cleanedOption);
          }
          // Check if line is Reference or Answer line: យោង..., សម្គាល់..., Ans: ..., ចម្លើយ...
          else if (/^(យោង|សម្គាល់|ans|answer|ចម្លើយ)[\:\s\=\-]/i.test(line)) {
            answer = line;

            if (!foundCorrectInOptions) {
              const ansChar = line.replace(/^(ans|answer|ចម្លើយ|យោង|សម្គាល់)[\:\s\=\-]*/i, '').trim().toUpperCase();
              if (ansChar.startsWith('A') || ansChar.startsWith('ក')) correct = 0;
              else if (ansChar.startsWith('B') || ansChar.startsWith('ខ')) correct = 1;
              else if (ansChar.startsWith('C') || ansChar.startsWith('គ')) correct = 2;
              else if (ansChar.startsWith('D') || ansChar.startsWith('ឃ')) correct = 3;
            }
          } else {
            // Append line to answer / explanation
            if (answer) {
              answer += ' ' + line;
            } else {
              answer = line;
            }
          }
        }

        if (options.length === 4) {
          parsed.push({
            subject: aiSubject,
            question: qLine,
            type: 'mcq',
            options,
            correct,
            answer: answer.trim() || undefined,
            isActive: true,
          });
        } else if (qLine) {
          parsed.push({
            subject: aiSubject,
            question: qLine,
            type: 'short',
            answer: answer.trim() || lines.slice(1).join('\n'),
            isActive: true,
          });
        }
      }
    }

    if (parsed.length > 0) {
      setGeneratedPreview(parsed);
      setBulkStatusMsg({
        text: `បានស្រង់ចេញ ${toKhmerNum(parsed.length)} សំណួរជោគជ័យ! សូមពិនិត្យ និងចុចរក្សាទុក`,
        success: true,
      });
    } else {
      setBulkStatusMsg({
        text: 'មិនអាចស្វែងរកទម្រង់សំណួរត្រឹមត្រូវទេ។ សូមពិនិត្យអត្ថបទម្ដងទៀត!',
        success: false,
      });
    }
  };

  // Swap Questions
  const handleSwapQuestions = async () => {
    const list = questions.filter((q) => q.subject === selectedSubjectToManage);
    const q1 = list[swapFromIndex - 1];
    const q2 = list[swapToIndex - 1];

    if (!q1 || !q2) {
      alert('សូមជ្រើសរើសលេខរៀងសំណួរដែលត្រឹមត្រូវ!');
      return;
    }

    await swapQuestions(q1, q2);
    alert(`បានដោះដូរទីតាំងរវាងសំណួរលេខ ${toKhmerNum(swapFromIndex)} និង ${toKhmerNum(swapToIndex)} ជោគជ័យ!`);
  };

  // Send Telegram Poll
  const handleSendTelegramPoll = async () => {
    if (!tgBotToken.trim() || !tgChatId.trim()) {
      setTelegramStatus({ text: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID / Channel!', success: false });
      return;
    }

    localStorage.setItem('master_quiz_tg_token', tgBotToken.trim());
    localStorage.setItem('master_quiz_tg_chat', tgChatId.trim());

    const targetQ = questions.find((q) => q.id === tgSelectedQuestionId);
    if (!targetQ || targetQ.type !== 'mcq' || !targetQ.options) {
      setTelegramStatus({ text: 'សូមជ្រើសរើសសំណួរ QCM ដែលមានជម្រើស ៤!', success: false });
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);

    try {
      const res = await fetch('/api/telegram/send-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgBotToken.trim(),
          chatId: tgChatId.trim(),
          question: targetQ.question,
          options: targetQ.options.map((o) => o.replace(/^[ក-ឃA-D]\.\s*/, '')),
          correct_option_id: targetQ.correct ?? 0,
          explanation: targetQ.answer || 'Master Quiz KH Quiz Poll',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Telegram Poll error');
      }

      setTelegramStatus({
        text: `បានបាញ់សំណួរទៅ Telegram Channel/Group ជោគជ័យ! (Poll ID: ${data.result?.poll?.id || ''})`,
        success: true,
      });
    } catch (err: any) {
      setTelegramStatus({ text: err.message || 'បរាជ័យក្នុងការផ្ញើទៅ Telegram', success: false });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Download PDF
  const handleExportPDF = () => {
    const element = document.getElementById('admin-printable-pdf');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${exportSubject}_MasterQuiz.pdf`,
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

  // Broadcast Notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    await broadcastNotification(broadcastMsg.trim(), broadcastType);
    setBroadcastMsg('');
    alert('បានផ្សាយដំណឹងទៅកាន់សមាជិកទាំងអស់ជោគជ័យ!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/90 border border-red-500/30 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-moul text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-300 to-amber-300">
              ផ្ទាំងគ្រប់គ្រង (Admin Control Center)
            </h1>
            <p className="text-xs text-slate-400">
              ប្រព័ន្ធគ្រប់គ្រងវិញ្ញាសា បង្កើតសំណួរតាម AI និងតាមដានសកម្មភាពសមាជិក
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-red-950 text-red-300 border border-red-800 text-xs font-semibold">
            Master Code: 168
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        {[
          { id: 'single', label: 'បញ្ចូលសំណួរទោល', icon: PlusCircle },
          { id: 'bulk_ai', label: 'បញ្ចូលជាដុំ & AI', icon: Sparkles },
          { id: 'manage', label: 'គ្រប់គ្រងមុខវិជ្ជា/សំណួរ', icon: Settings },
          { id: 'export', label: 'Export វិញ្ញាសា (PDF)', icon: Download },
          { id: 'telegram', label: 'Telegram Bot', icon: Send },
          { id: 'monitoring', label: 'Logins & វត្តមាន', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SINGLE QUESTION ENTRY */}
      {activeSubTab === 'single' && (
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
          <h2 className="font-moul text-base sm:text-lg text-slate-100 mb-2">
            បញ្ចូលសំណួរទោល (Single Entry)
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            ជ្រើសរើសមុខវិជ្ជា និងបំពេញព័ត៌មានសំណួរតាមទម្រង់ខាងក្រោម
          </p>

          {singleStatusMsg && (
            <div
              className={`p-3.5 rounded-2xl mb-6 text-xs flex items-center gap-2 border ${
                singleStatusMsg.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}
            >
              {singleStatusMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{singleStatusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSingleQuestion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  មុខវិជ្ជាដែលមានស្រាប់
                </label>
                <select
                  value={singleSubject}
                  onChange={(e) => setSingleSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ឬ បង្កើតមុខវិជ្ជាថ្មី
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="វាយឈ្មោះមុខវិជ្ជាថ្មី (ប្រសិនបើមាន)"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ប្រភេទសំណួរ</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mcq', label: '📑 QCM (ពហុជម្រើស)' },
                  { id: 'short', label: '🖊️ Q & A (ខ្លី)' },
                  { id: 'explanation', label: '📖 ពន្យល់ពាក្យ' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSingleType(t.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      singleType === t.id
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {singleType === 'explanation' ? 'ពាក្យគន្លឹះ / វាក្យសព្ទ' : 'អត្ថបទសំណួរ'} *
              </label>
              <textarea
                rows={3}
                value={singleQuestionText}
                onChange={(e) => setSingleQuestionText(e.target.value)}
                placeholder="ឧ. តើព្រះរាជាណាចក្រកម្ពុជាប្រកាន់យករបបដឹកនាំរដ្ឋបែបណា?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-red-500"
                required
              />
            </div>

            {/* If MCQ: 4 options with radio */}
            {singleType === 'mcq' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  ជម្រើសទាំង ៤ (ជ្រើសរើស Option ណាជាចម្លើយត្រឹមត្រូវ) *
                </label>
                {singleOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={singleCorrect === oIdx}
                      onChange={() => setSingleCorrect(oIdx)}
                      className="text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold w-6 text-amber-300">
                      {getOptionLabel(oIdx, singleSubject)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...singleOptions];
                        next[oIdx] = e.target.value;
                        setSingleOptions(next);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                      placeholder={`ជម្រើស ${getOptionLabel(oIdx, singleSubject)}`}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {/* If Short or Explanation: Answer textarea */}
            {(singleType === 'short' || singleType === 'explanation') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ចម្លើយបកស្រាយពេញលេញ *
                </label>
                <textarea
                  rows={4}
                  value={singleAnswer}
                  onChange={(e) => setSingleAnswer(e.target.value)}
                  placeholder="បញ្ចូលការបកស្រាយលម្អិត..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>រក្សាទុកសំណួរទៅក្នុងប្រព័ន្ធ</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. BULK IMPORT & AI GENERATOR */}
      {activeSubTab === 'bulk_ai' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* AI Generator Panel */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-moul text-base sm:text-lg text-indigo-200">
                  បង្កើតសំណួរស្វ័យប្រវត្តិតាម Google Gemini AI
                </h2>
                <p className="text-xs text-slate-400">
                  ប្រើប្រាស់ AI ដើម្បីបង្កើតវិញ្ញាសាត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋកម្ពុជាត្រឹមត្រូវតាមស្ដង់ដារ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">មុខវិជ្ជា</label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ប្រភេទសំណួរ</label>
                <select
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="mcq">📑 QCM (ពហុជម្រើស)</option>
                  <option value="short">🖊️ Q & A (ខ្លី)</option>
                  <option value="explanation">📖 ពន្យល់ពាក្យ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ចំនួនសំណួរ</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value={3}>៣ សំណួរ</option>
                  <option value={5}>៥ សំណួរ</option>
                  <option value={10}>១០ សំណួរ</option>
                  <option value={15}>១៥ សំណួរ</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ប្រធានបទជាក់លាក់ ឬចំណុចផ្តោត (Optional)
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="ឧ. ច្បាប់ស្តីពីសហលក្ខន្តិកៈមន្ត្រីរាជការស៊ីវិល ឬ រដ្ឋធម្មនុញ្ញឆ្នាំ១៩៩៣"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateAiQuestions}
              disabled={isAiGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiGenerating ? 'កំពុងបង្កើតដោយ AI...' : 'ដំណើរការបង្កើតសំណួរតាម Gemini AI'}</span>
            </button>
          </div>

          {/* Paste Raw Text Import */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-moul text-base sm:text-lg text-amber-200">
                  បញ្ចូលជាដុំដោយ Paste អត្ថបទ (Bulk Paste)
                </h2>
                <p className="text-xs text-slate-400">
                  ចម្លង និងបិទភ្ជាប់អត្ថបទសំណួរច្រើនក្នុងពេលតែមួយ
                </p>
              </div>
            </div>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`គំរូទម្រង់ Paste៖
១. ច្បាប់ស្ដីពីកាតព្វកិច្ចយោធាបច្ចុប្បន្ន ត្រូវបានប្រកាសឱ្យប្រើនៅថ្ងៃខែឆ្នាំ?
ក. ១២ ឧសភា ២០២៦
ខ. ២០ ឧសភា ២០២៦
គ. ២៣ ឧសភា ២០២៦ (ចម្លើយត្រឹមត្រូវ)
ឃ. ២៥ ឧសភា ២០២៦
យោង ៖ ព្រះរាជក្រមលេខ នស/រកម/០៥២៦/០០៨។`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono mb-4 focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={handleParseBulkText}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition"
            >
              <span>ពិនិត្យ និងបំប្លែងទិន្នន័យ (Parse)</span>
            </button>
          </div>

          {/* Preview & Save Generated Questions */}
          {generatedPreview.length > 0 && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-moul text-base text-emerald-300">
                  សំណួរដែលបានរៀបចំរួចរាល់ ({toKhmerNum(generatedPreview.length)})
                </h3>
                <button
                  onClick={handleSaveGeneratedQuestions}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>រក្សាទុកទាំងអស់ទៅក្នុង Database</span>
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {generatedPreview.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <p className="font-semibold text-slate-100 mb-1">
                      {idx + 1}. {q.question}
                    </p>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 pl-4 mt-1">
                        {q.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className={oIdx === q.correct ? 'text-emerald-400 font-bold' : ''}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.answer && (
                      <p className="text-[11px] text-amber-300 mt-1 pl-4">ចម្លើយ៖ {q.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bulkStatusMsg && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
                bulkStatusMsg.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}
            >
              {bulkStatusMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{bulkStatusMsg.text}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. MANAGE SUBJECTS & QUESTIONS (Swap, Reorder, Delete) */}
      {activeSubTab === 'manage' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Subjects Table */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <h2 className="font-moul text-base text-slate-100 mb-4">
              គ្រប់គ្រងមុខវិជ្ជា (Subjects Management)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">ល.រ</th>
                    <th className="py-2.5 px-3">ឈ្មោះមុខវិជ្ជា</th>
                    <th className="py-2.5 px-3">ប្រភេទ</th>
                    <th className="py-2.5 px-3">ចំនួនសំណួរ</th>
                    <th className="py-2.5 px-3">ស្ថានភាព</th>
                    <th className="py-2.5 px-3 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subjects.map((sub, idx) => {
                    const count = questions.filter((q) => q.subject === sub.name).length;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-moul text-amber-400">{toKhmerNum(idx + 1)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{sub.name}</td>
                        <td className="py-3 px-3 uppercase text-[10px] text-cyan-300 font-bold">
                          {sub.type}
                        </td>
                        <td className="py-3 px-3">{toKhmerNum(count)} សំណួរ</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => updateSubject(sub.id, { isActive: !sub.isActive })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.isActive !== false
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {sub.isActive !== false ? 'បើកដំណើរការ' : 'បានបិទ'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditSubjectModal(sub)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="កែប្រែមេរៀន/មុខវិជ្ជា"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`តើអ្នកពិតជាចង់លុបមុខវិជ្ជា "${sub.name}" មែនទេ?`)) {
                                deleteSubject(sub.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300"
                            title="លុបមុខវិជ្ជា"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question List & Swap Tool for Selected Subject */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-moul text-base text-slate-100">
                  បញ្ជីសំណួរ និងមុខងារ Swap ដោះដូរទីតាំង
                </h2>
                <p className="text-xs text-slate-400">
                  ជ្រើសរើសមុខវិជ្ជាដើម្បីពិនិត្យ កែប្រែ ឬដោះដូរទីតាំងសំណួរ
                </p>
              </div>

              <select
                value={selectedSubjectToManage}
                onChange={(e) => setSelectedSubjectToManage(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Controls */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-amber-300 flex items-center gap-1">
                <ArrowUpDown className="w-4 h-4" />
                <span>ដោះដូរទីតាំងសំណួរ (Swap):</span>
              </span>
              <span>ពីសំណួរទី</span>
              <input
                type="number"
                min={1}
                value={swapFromIndex}
                onChange={(e) => setSwapFromIndex(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-center"
              />
              <span>ទៅសំណួរទី</span>
              <input
                type="number"
                min={1}
                value={swapToIndex}
                onChange={(e) => setSwapToIndex(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-center"
              />
              <button
                type="button"
                onClick={handleSwapQuestions}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                អនុវត្ត Swap
              </button>
            </div>

            {/* Question Items */}
            <div className="space-y-3">
              {questions
                .filter((q) => q.subject === selectedSubjectToManage)
                .map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-moul text-amber-400">
                          {toKhmerNum(idx + 1)}.
                        </span>
                        <p className="font-medium text-slate-100">{q.question}</p>
                      </div>
                      {q.type === 'mcq' && q.options && (
                        <p className="text-[11px] text-slate-400 pl-4">
                          ចម្លើយត្រូវ៖{' '}
                          <strong className="text-emerald-400">
                            {q.options[q.correct ?? 0]}
                          </strong>
                        </p>
                      )}
                      {q.answer && (
                        <p className="text-[11px] text-rose-300 pl-4 truncate max-w-xl">
                          {q.answer}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditQuestionModal(q)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                        title="កែប្រែសំណួរ ចម្លើយ ជម្រើស និងឯកសារយោង"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (q.id && confirm('តើអ្នកពិតជាចង់លុបសំណួរនេះមែនទេ?')) {
                            deleteQuestion(q.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPORT PAPER AS PDF */}
      {activeSubTab === 'export' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl">
            <h2 className="font-moul text-base sm:text-lg text-slate-100 mb-2">
              ទាញយកវិញ្ញាសាជាឯកសារ PDF A4
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              រៀបចំ និងបោះពុម្ពវិញ្ញាសាប្រឡងក្របខ័ណ្ឌរដ្ឋជាទម្រង់ស្ដង់ដារ A4
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ជ្រើសរើសមុខវិជ្ជា
                </label>
                <select
                  value={exportSubject}
                  onChange={(e) => setExportSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ទម្រង់គំរូ (Template)
                </label>
                <select
                  value={exportTemplate}
                  onChange={(e) => setExportTemplate(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="royal">Royal Navy & Gold (ផ្លូវការ)</option>
                  <option value="classic">Classic Clean (សាមញ្ញ)</option>
                  <option value="vivid">Vivid Maroon (កម្រាលរដ្ឋបាល)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  បង្ហាញចម្លើយត្រឹមត្រូវ?
                </label>
                <select
                  value={includeAnswerKey ? 'yes' : 'no'}
                  onChange={(e) => setIncludeAnswerKey(e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="yes">បង្ហាញចម្លើយ (សម្រាប់ពិនិត្យ)</option>
                  <option value="no">លាក់ចម្លើយ (សម្រាប់ធ្វើតេស្តក្រដាស)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកវិញ្ញាសាជា PDF (A4)</span>
            </button>
          </div>

          {/* Printable Preview Container */}
          <div
            id="admin-printable-pdf"
            className="p-8 rounded-3xl bg-white text-slate-900 border shadow-xl"
          >
            {/* Header */}
            <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
              <p className="font-moul text-base text-amber-600">ព្រះរាជាណាចក្រកម្ពុជា</p>
              <p className="font-siemreap text-xs text-slate-700 font-bold tracking-widest">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </p>
              <div className="w-24 h-0.5 bg-amber-500 mx-auto my-2" />
              <h2 className="font-moul text-lg text-slate-900 mt-2">
                វិញ្ញាសាត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋ៖ {exportSubject}
              </h2>
              <p className="text-[11px] text-slate-600 mt-1">
                ប្រព័ន្ធគ្រប់គ្រង និងធ្វើតេស្ត Master Quiz KH
              </p>
            </div>

            {/* Questions list */}
            <div className="space-y-4">
              {questions
                .filter((q) => q.subject === exportSubject)
                .map((q, idx) => (
                  <div key={q.id || idx} className="text-xs leading-relaxed">
                    <p className="font-semibold text-slate-900">
                      {toKhmerNum(idx + 1)}. {q.question}
                    </p>
                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-2 gap-2 mt-1 pl-4 text-slate-800">
                        {q.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className={
                              includeAnswerKey && oIdx === q.correct
                                ? 'font-bold text-emerald-700 underline'
                                : ''
                            }
                          >
                            {getOptionLabel(oIdx, q.subject)}. {opt.replace(/^[ក-ឃA-D]\.\s*/, '')}
                          </span>
                        ))}
                      </div>
                    )}
                    {includeAnswerKey && q.answer && (
                      <p className="text-[11px] text-red-800 mt-1 pl-4 font-siemreap">
                        <strong>ចម្លើយបកស្រាយ៖</strong> {q.answer}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TELEGRAM BOT INTEGRATION */}
      {activeSubTab === 'telegram' && (
        <div className="bg-slate-900/90 rounded-3xl border border-cyan-500/30 p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-moul text-base sm:text-lg text-cyan-300">
                Telegram Bot Integration
              </h2>
              <p className="text-xs text-slate-400">
                បាញ់បញ្ជូនសំណួរ QCM ទៅកាន់ Telegram Channel ឬ Group ជាទម្រង់ Quiz Poll ស្វ័យប្រវត្តិ
              </p>
            </div>
          </div>

          {telegramStatus && (
            <div
              className={`p-3.5 rounded-2xl mb-4 text-xs flex items-center gap-2 border ${
                telegramStatus.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}
            >
              {telegramStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{telegramStatus.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telegram Bot Token *
              </label>
              <input
                type="text"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ទទួលបានពី @BotFather នៅលើ Telegram
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chat ID ឬ Channel Username *
              </label>
              <input
                type="text"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                placeholder="ឧ. @qcm_and_q_a ឬ -100123456789"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ជ្រើសរើសសំណួរ QCM ដើម្បីផ្ញើ *
              </label>
              <select
                value={tgSelectedQuestionId}
                onChange={(e) => setTgSelectedQuestionId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- សូមជ្រើសរើសសំណួរ --</option>
                {questions
                  .filter((q) => q.type === 'mcq' && q.options)
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.subject}] {q.question.slice(0, 70)}...
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleSendTelegramPoll}
              disabled={isSendingTelegram}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTelegram ? 'កំពុងផ្ញើ...' : 'បាញ់សំណួរទៅ Telegram Poll'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. LOGINS, PRESENCE & BROADCAST NOTIFICATIONS */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Broadcast Announcement Form */}
          <div className="bg-slate-900/90 rounded-3xl border border-amber-500/30 p-6 shadow-xl">
            <h2 className="font-moul text-base text-amber-300 mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>ផ្ញើដំណឹងប្រកាសទៅកាន់សមាជិក (Broadcast Notification)</span>
            </h2>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="វាយអត្ថបទដំណឹងប្រកាសជូនសមាជិកទាំងអស់..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="info">ព័ត៌មាន (Info)</option>
                  <option value="success">ជោគជ័យ (Success)</option>
                  <option value="warning">ការប្រុងប្រយ័ត្ន (Warning)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  ផ្សាយដំណឹង
                </button>
              </div>
            </form>
          </div>

          {/* Active Online Presence Table */}
          <div className="bg-slate-900/90 rounded-3xl border border-emerald-500/30 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-moul text-base text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>អ្នកកំពុង Online ក្នុងរង្វង់ ៥នាទីចុងក្រោយ ({toKhmerNum(presence.length)})</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presence.length === 0 ? (
                <p className="text-xs text-slate-500 col-span-4">មិនទាន់មានទិន្នន័យវត្តមាន</p>
              ) : (
                presence.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-slate-200 truncate">{p.username}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono ml-auto">
                      {p.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Login History Log Table */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <h2 className="font-moul text-base text-slate-100 mb-4">
              ប្រវត្តិនៃការ Login (Login Records)
            </h2>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Username</th>
                    <th className="py-2 px-3">លេខកូដដែលបានប្រើ</th>
                    <th className="py-2 px-3">តួនាទី</th>
                    <th className="py-2 px-3">កាលបរិច្ឆេទ & ម៉ោង</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logins.slice(0, 30).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-slate-200 font-sans">
                        {l.username}
                      </td>
                      <td className="py-2 px-3 text-amber-300">{l.passwordUsed}</td>
                      <td className="py-2 px-3 uppercase text-[10px]">{l.role}</td>
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(l.timestamp).toLocaleString('km-KH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feedbacks from users */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <h2 className="font-moul text-base text-slate-100 mb-4">
              មតិយោបល់ពីសមាជិក ({toKhmerNum(feedbacks.length)})
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {feedbacks.length === 0 ? (
                <p className="text-xs text-slate-500">មិនទាន់មានមតិយោបល់ពីសមាជិកនៅឡើយ</p>
              ) : (
                feedbacks.map((fb) => (
                  <div key={fb.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-cyan-300">{fb.username}</strong>
                      <span className="text-[10px] text-slate-400">
                        {new Date(fb.createdAt).toLocaleString('km-KH')}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{fb.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT QUESTION */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-y-auto">
            <button
              onClick={() => setEditingQuestion(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-moul text-lg text-amber-300">កែប្រែសំណួរ និងចម្លើយ</h3>
                <p className="text-xs text-slate-400">កែសម្រួលអត្ថបទសំណួរ ជម្រើសចម្លើយ ភាគត្រឹមត្រូវ ឬឯកសារយោង</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuestionEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">មុខវិជ្ជា</label>
                  <select
                    value={editQuestionSubject}
                    onChange={(e) => setEditQuestionSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ប្រភេទសំណួរ</label>
                  <select
                    value={editQuestionType}
                    onChange={(e) => setEditQuestionType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="mcq">📑 QCM (ពហុជម្រើស)</option>
                    <option value="short">🖊️ Q & A (ខ្លី)</option>
                    <option value="explanation">📖 ពន្យល់ពាក្យ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {editQuestionType === 'explanation' ? 'ពាក្យគន្លឹះ / វាក្យសព្ទ' : 'អត្ថបទសំណួរ'} *
                </label>
                <textarea
                  rows={3}
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* If MCQ: Options & Correct Option radio */}
              {editQuestionType === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    ជម្រើសទាំង ៤ (ជ្រើសរើស Option ណាជាចម្លើយត្រឹមត្រូវ) *
                  </label>
                  {editQuestionOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editCorrectOptionRadio"
                        checked={editQuestionCorrect === oIdx}
                        onChange={() => setEditQuestionCorrect(oIdx)}
                        className="text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold w-6 text-amber-300">
                        {getOptionLabel(oIdx, editQuestionSubject)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...editQuestionOptions];
                          next[oIdx] = e.target.value;
                          setEditQuestionOptions(next);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Detailed Answer / Reference Document */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {editQuestionType === 'mcq'
                    ? 'ឯកសារយោង / ការបកស្រាយចម្លើយ (Optional / យោង ៖ ...)'
                    : 'ចម្លើយបកស្រាយពេញលេញ *'}
                </label>
                <textarea
                  rows={3}
                  value={editQuestionAnswer}
                  onChange={(e) => setEditQuestionAnswer(e.target.value)}
                  placeholder="ឧ. យោង ៖ ព្រះរាជក្រមលេខ នស/រកម/០៥២៦/០០៨..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBJECT */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setEditingSubject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-moul text-lg text-cyan-300">កែប្រែមុខវិជ្ជា</h3>
                <p className="text-xs text-slate-400">កែសម្រួលឈ្មោះ ស្ថានភាព និងប្រភេទមុខវិជ្ជា</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubjectEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ឈ្មោះមុខវិជ្ជា *</label>
                <input
                  type="text"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ប្រភេទចម្បង</label>
                <select
                  value={editSubjectType}
                  onChange={(e) => setEditSubjectType(e.target.value as QuestionType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="mcq">📑 QCM (ពហុជម្រើស)</option>
                  <option value="short">🖊️ Q & A (ខ្លី)</option>
                  <option value="explanation">📖 ពន្យល់ពាក្យ</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-xs text-slate-300">ស្ថានភាពដំណើរការ</span>
                <button
                  type="button"
                  onClick={() => setEditSubjectIsActive(!editSubjectIsActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    editSubjectIsActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {editSubjectIsActive ? 'បើកដំណើរការ' : 'បានបិទ'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
