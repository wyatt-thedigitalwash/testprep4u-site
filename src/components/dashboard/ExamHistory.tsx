interface ExamAttempt {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
}

interface ExamHistoryProps {
  attempts: ExamAttempt[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-error";
}

function getScoreBadge(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: "bg-success-light", text: "text-success", label: "Pass" };
  if (score >= 70) return { bg: "bg-warning-light", text: "text-warning", label: "Borderline" };
  return { bg: "bg-error-light", text: "text-error", label: "Needs Work" };
}

export function ExamHistory({ attempts }: ExamHistoryProps) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No practice exam attempts yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Attempt
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Score
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => {
            const badge = getScoreBadge(attempt.score);
            return (
              <tr
                key={attempt.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-3 text-sm font-medium text-navy">
                  #{attempt.id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(attempt.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-bold ${getScoreColor(attempt.score)}`}
                >
                  {attempt.score}%
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
