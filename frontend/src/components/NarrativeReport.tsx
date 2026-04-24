interface Narrative {
  summary?: string;
  severity_rating?: string;
  affected_groups?: string[];
  root_cause_analysis?: string;
  plain_english_explanation?: string;
  remediation_steps?: string[];
}

interface NarrativeReportProps {
  narrative: Narrative | null | undefined;
}

export const NarrativeReport = ({ narrative }: NarrativeReportProps) => {
  if (!narrative) {
    return (
      <p className="body-md text-indigo-700/60 italic">
        AI narrative is being generated…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
      <div>
        <h4 className="label-sm text-indigo-400 mb-4 tracking-[0.2em] font-black">SUMMARY</h4>
        <p className="body-md text-indigo-950 font-medium leading-relaxed">
          {narrative.plain_english_explanation || narrative.summary || 'Analysis in progress…'}
        </p>
      </div>
      <div>
        <h4 className="label-sm text-indigo-400 mb-4 tracking-[0.2em] font-black">WHO IS AFFECTED</h4>
        <div className="flex flex-wrap gap-2">
          {narrative.affected_groups?.length ? (
            narrative.affected_groups.map((group, i) => (
              <span
                key={i}
                className="bg-white/80 px-4 py-2 rounded-full text-xs font-bold text-indigo-900 border border-indigo-100 shadow-sm flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0" />
                {group}
              </span>
            ))
          ) : (
            <span className="text-sm text-indigo-700/60">No specific groups identified</span>
          )}
        </div>

        {narrative.root_cause_analysis && (
          <div className="mt-6">
            <h4 className="label-sm text-indigo-400 mb-2 tracking-[0.2em] font-black">ROOT CAUSE</h4>
            <p className="body-md text-indigo-950 font-medium leading-relaxed text-sm">
              {narrative.root_cause_analysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
