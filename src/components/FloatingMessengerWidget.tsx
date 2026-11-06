import React, { useState } from 'react';
import { MessageCircle, X, Bell, Send, CheckCircle2 } from 'lucide-react';
import { AppNotification, UserSession } from '../types';
import { submitFeedback } from '../services/firebase';
import { toKhmerNum } from '../utils/khmer';

interface FloatingMessengerWidgetProps {
  notifications: AppNotification[];
  session: UserSession;
}

export const FloatingMessengerWidget: React.FC<FloatingMessengerWidgetProps> = ({
  notifications,
  session,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifs' | 'feedback'>('notifs');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback(session.username, feedbackText.trim());
      setFeedbackText('');
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Floating Circular Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group border-2 border-white/20"
          title="ដំណឹងប្រព័ន្ធ & ផ្ញើមតិយោបល់"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
              {toKhmerNum(notifications.length)}
            </span>
          )}
        </button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[500px] animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-moul text-sm">ប្រព័ន្ធដំណឹង & មតិយោបល់</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
            <button
              onClick={() => setActiveTab('notifs')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'notifs'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>🔔 ដំណឹងប្រព័ន្ធ ({toKhmerNum(notifications.length)})</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'feedback'
                  ? 'bg-slate-800 text-cyan-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>💬 ផ្ញើមតិយោបល់</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === 'notifs' ? (
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">មិនទាន់មានដំណឹងថ្មីទេ</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                        notif.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : notif.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-200'
                      }`}
                    >
                      <p className="font-kantumruy">{notif.message}</p>
                      <span className="block text-[10px] text-slate-400 mt-1.5 font-mono">
                        {new Date(notif.timestamp).toLocaleString('km-KH')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3 font-kantumruy">
                  សូមផ្ញើមតិយោបល់ សំណូមពរវិញ្ញាសា ឬរាយការណ៍បញ្ហាមកកាន់ Admin៖
                </p>

                {isSent && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>បានផ្ញើមតិយោបល់ជោគជ័យ! អរគុណច្រើន</span>
                  </div>
                )}

                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="សរសេរមតិយោបល់របស់អ្នកនៅទីនេះ..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើមតិយោបល់'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
