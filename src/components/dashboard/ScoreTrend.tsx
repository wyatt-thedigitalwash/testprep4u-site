interface ExamAttempt {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
}

interface ScoreTrendProps {
  attempts: ExamAttempt[];
}

export function ScoreTrend({ attempts }: ScoreTrendProps) {
  if (attempts.length === 0) return null;

  const maxScore = 100;
  const targetScore = 80;
  const chartHeight = 200;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-navy">
        Score Trend
      </h3>

      <div className="relative" style={{ height: chartHeight }}>
        {/* Target line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-success/40"
          style={{ top: `${((maxScore - targetScore) / maxScore) * 100}%` }}
        >
          <span className="absolute -top-3 right-0 text-xs font-semibold text-success">
            80% Target
          </span>
        </div>

        {/* Bars */}
        <div className="flex h-full items-end justify-center gap-8">
          {attempts.map((attempt) => {
            const heightPct = (attempt.score / maxScore) * 100;
            const isAboveTarget = attempt.score >= targetScore;

            return (
              <div
                key={attempt.id}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-sm font-bold text-navy">
                  {attempt.score}%
                </span>
                <div
                  className={`w-16 rounded-t-lg transition-all duration-500 ${
                    isAboveTarget ? "bg-success" : "bg-blue-500"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-xs text-gray-500">
                  {new Date(attempt.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
