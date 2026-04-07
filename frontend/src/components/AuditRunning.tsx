interface AuditRunningProps {
  progress: number;
  currentStep: string;
}

export const AuditRunning = ({ progress, currentStep }: AuditRunningProps) => {
  const steps = [
    { id: 1, name: 'Dataset parsed', description: 'Analyzing structure and content' },
    { id: 2, name: 'Fairness metrics', description: 'Computing demographic parity and equalized odds' },
    { id: 3, name: 'SHAP analysis', description: 'Computing feature importance' },
    { id: 4, name: 'Gemini report', description: 'Generating audit narrative' },
    { id: 5, name: 'Complete', description: 'Storing results' },
  ];

  const getStepStatus = (stepId: number) => {
    const stepProgress = (stepId - 1) * 20;
    if (progress > stepProgress) return 'completed';
    if (currentStep.toLowerCase().includes(steps[stepId - 1]?.name.toLowerCase() || ''))
      return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Running Fairness Audit</h1>
          <p className="text-gray-600">Analyzing your dataset for bias and unfairness...</p>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center mb-12">
          <div className="relative w-32 h-32 rounded-full border-8 border-gray-200 bg-white flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent transition-all duration-300"
              style={{
                background: `conic-gradient(#4F46E5 ${progress * 3.6}deg, transparent 0deg)`,
              }}
            />
            <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const isActive = status === 'active';
            const isCompleted = status === 'completed';

            return (
              <div key={step.id} className="flex items-start gap-4">
                <div
                  className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white transition ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-gray-300'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {step.name}
                  </p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
