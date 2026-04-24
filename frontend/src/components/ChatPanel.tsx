import { useState } from 'react';
import { apiClient } from '../api/client';

interface ChatPanelProps {
  auditId: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'How can I mitigate race proxy bias?',
  'Which group is most affected by this model?',
  'What are the top remediation steps I should take?',
];

export const ChatPanel = ({ auditId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuestion = async (q: string) => {
    if (!q.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await apiClient.post(`/chat/${auditId}`, { question: q });
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.data.answer || 'No response received.',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to reach Gemini. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-indigo-100 pt-8">
      {/* Chat history */}
      {messages.length > 0 && (
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white text-indigo-900 border border-indigo-100 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-indigo-100 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] font-bold text-indigo-400 py-2 uppercase tracking-widest">SUGGESTED:</span>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendQuestion(q)}
            disabled={loading}
            className="bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendQuestion(question)}
          placeholder="Ask Gemini about this audit…"
          disabled={loading}
          className="w-full bg-white border-none rounded-2xl py-4 pl-6 pr-16 focus:ring-4 focus:ring-indigo-100 placeholder-indigo-300 text-indigo-900 font-medium shadow-sm"
        />
        <button
          onClick={() => sendQuestion(question)}
          disabled={loading || !question.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl hover:scale-110 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
};
