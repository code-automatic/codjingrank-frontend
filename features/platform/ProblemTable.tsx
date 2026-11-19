import Link from "next/link";
import type { ProblemSummaryModel } from "@/lib/api";
import { describeProblemItem } from "@/features/catalog/viewModel";
import { Icon } from "@/lib/ui/Icon";
export function ProblemTable({
  problems,
}: {
  problems: ProblemSummaryModel[];
}) {
  return (
    <div className="platform-table-scroll">
      <table className="platform-problem-table">
        <caption className="sr-only">
          Danh sách bài tập, trạng thái, tỉ lệ Accepted và độ khó
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Trạng thái</span>
            </th>
            <th scope="col">Tên bài tập</th>
            <th scope="col">Accepted</th>
            <th scope="col">Độ khó</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem) => {
            const view = describeProblemItem(problem);
            return (
              <tr key={problem.id}>
                <td>
                  {problem.solved ? (
                    <span aria-label="Đã giải">
                      <Icon name="check" />
                    </span>
                  ) : (
                    <span
                      className="muted"
                      aria-label={view.isLocked ? "Chưa mở khóa" : "Chưa giải"}
                    >
                      <Icon
                        name={view.isLocked ? "lock" : "circle"}
                        size={15}
                      />
                    </span>
                  )}
                </td>
                <td>
                  {view.openHref ? (
                    <Link href={view.openHref}>{problem.title}</Link>
                  ) : (
                    <span title={view.lockReason || undefined}>
                      {problem.title}
                    </span>
                  )}
                  <small>
                    {problem.tags.map((tag) => tag.name).join(" · ") ||
                      problem.packageSlug}
                    {view.isLocked && " · Chưa mở khóa"}
                  </small>
                </td>
                <td>{problem.formattedAcceptanceRate}</td>
                <td
                  className="platform-difficulty"
                  data-difficulty={problem.difficulty}
                >
                  {view.difficultyLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
