import { useState } from 'react';
import { apiClient } from '../api/client';

interface ChatPanelProps {
  auditId: string;
}

export const ChatPanel = ({ auditId }: ChatPanelProps) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'Which groups are most affected by unfairness in this model?',
    'What are the main causes of the fairness issues detected?',
    'What concrete steps can we take to address these fairness violations?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.post(`/chat/${auditId}`, { question });
      setAnswer(res.data.answer);
      setQuestion('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Ask Gemini About This Audit</h3>

      <div className="space-y-4">
        {!answer && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this audit..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? '...' : '→'}
          </button>
        </form>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        {answer && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{answer}</p>
            <button
              onClick={() => {
                setAnswer('');
                setQuestion('');
              }}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
