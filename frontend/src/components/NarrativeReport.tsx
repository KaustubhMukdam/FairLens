interface NarrativeReportProps {
  narrative: {
    summary: string;
    severity_rating: 'HIGH' | 'MEDIUM' | 'LOW';
    affected_groups: string[];
    root_cause_analysis: string;
    remediation_steps: string[];
    plain_english_explanation: string;
  };
}

export const NarrativeReport = ({ narrative }: NarrativeReportProps) => {
  const ratingColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    LOW: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <div className={`rounded-lg p-6 border ${ratingColors[narrative.severity_rating]}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold">✦ Gemini AI Report</h3>
        <span className={`text-xs font-semibold px-3 py-1 rounded border ${ratingColors[narrative.severity_rating]}`}>
          {narrative.severity_rating} SEVERITY
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
          <p className="text-gray-700">{narrative.summary}</p>
        </div>

        {narrative.affected_groups.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Who Is Affected</h4>
            <div className="flex flex-wrap gap-2">
              {narrative.affected_groups.map((group) => (
                <span key={group} className="text-sm bg-white bg-opacity-50 px-3 py-1 rounded-full border">
                  {group}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Root Cause Analysis</h4>
          <p className="text-gray-700 text-sm">{narrative.root_cause_analysis}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions</h4>
          <ol className="list-decimal list-inside space-y-2">
            {narrative.remediation_steps.map((step, idx) => (
              <li key={idx} className="text-gray-700 text-sm">
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Plain English Explanation</h4>
          <p className="text-gray-700 text-sm italic">{narrative.plain_english_explanation}</p>
        </div>
      </div>
    </div>
  );
};
