"use client";

import Link from "next/link";
import { Icon } from "@/lib/ui/Icon";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import { ApiError, errorText } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import type { LeaderboardEntryModel } from "@/lib/api/adapters/shared";
import type { PackageModel } from "@/lib/api/adapters/catalog";
import { boardHref, parseBoardQuery, type BoardQuery } from "./query";
import { createBoardResource } from "./resource";
import {
  PracticeArtwork,
  RankingAvatar,
  RankingTrophy,
} from "./RankingVisuals";
import styles from "./leaderboard.module.css";

const number = new Intl.NumberFormat("vi-VN");
const scopes = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
] as const;

function Failure({ error, retry }: { error: unknown; retry: () => void }) {
  const unauthorized = error instanceof ApiError && error.status === 401;
  return (
    <div className={styles.message} role="alert">
      <p>{errorText(error)}</p>
      {unauthorized ? (
        <Link href="/login">Đăng nhập lại</Link>
      ) : (
        <button onClick={retry} type="button">
          Thử lại
        </button>
      )}
    </div>
  );
}

function Entry({ entry }: { entry: LeaderboardEntryModel }) {
  return (
    <dl className={styles.stats}>
      <div>
        <dt>Thứ hạng</dt>
        <dd>#{number.format(entry.rank)}</dd>
      </div>
      <div>
        <dt>Bài đã giải</dt>
        <dd>{number.format(entry.solvedProblemCount)}</dd>
      </div>
      <div>
        <dt>Lời giải Accepted</dt>
        <dd>{number.format(entry.acceptedSolutionCount)}</dd>
      </div>
    </dl>
  );
}

function Results({
  query,
  expanded,
  onExpand,
  panel,
  onPanel,
}: {
  query: BoardQuery;
  expanded: boolean;
  onExpand: (value: boolean) => void;
  panel: "ranking" | "me";
  onPanel: (value: "ranking" | "me") => void;
}) {
  const api = useApiClient();
  const { status, user } = useSession();
  const authenticated = status === "authenticated";
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [resource] = useState(() => createBoardResource(api));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  useEffect(() => {
    void resource.load(query, authenticated);
    return () => resource.dispose();
  }, [resource, query, authenticated]);
  const { board, me } = state;
  const pages = board.data
    ? Math.max(1, Math.ceil(board.data.total / board.data.size))
    : 1;
  const outside =
    me.data?.entry &&
    board.data &&
    !board.data.items.some((entry) => entry.userId === me.data?.entry?.userId);
  const retry = (part: "board" | "me") => {
    void resource.retry(part, query, authenticated);
  };
  const pageStart = Math.min(
    Math.max(1, query.page - 2),
    Math.max(1, pages - 4),
  );
  const pageNumbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => pageStart + index,
  );
  function changeExpanded(value: boolean) {
    onExpand(value);
    onPanel("ranking");
    requestAnimationFrame(() => heading.current?.focus());
  }
  const leaders = query.page === 1 ? (board.data?.items.slice(0, 3) ?? []) : [];
  const compact = board.data?.items.slice(query.page === 1 ? 3 : 0, 10) ?? [];
  return (
    <div className={`${styles.results} ${expanded ? styles.expanded : ""}`}>
      <aside className={styles.overview} aria-labelledby="overview-heading">
        <h2 id="overview-heading" className={styles.rankingRibbon} lang="en">
          Global Ranking
        </h2>
        {board.phase === "loading" && (
          <p className={styles.message} role="status">
            Đang tải thứ hạng…
          </p>
        )}
        {board.phase === "guest" && (
          <p className={styles.subtle}>
            Đăng nhập để xem bảng xếp hạng theo bộ lọc này.
          </p>
        )}
        {board.phase === "error" && (
          <p className={styles.subtle}>
            Chưa tải được thứ hạng. Bạn có thể thử lại trong bảng bên cạnh.
          </p>
        )}
        {leaders.length > 0 && (
          <div
            className={styles.podium}
            aria-label="Những người học dẫn đầu trang đầu"
          >
            {leaders.map((entry, index) => (
              <div
                key={entry.userId}
                data-rank={entry.rank}
                className={`${styles.podiumEntry} ${index === 0 ? styles.podiumLead : ""}`}
                style={{
                  gridColumn: index === 0 ? 2 : index === 1 ? 1 : 3,
                  gridRow: 1,
                }}
              >
                <span className={styles.podiumRank}>
                  #{number.format(entry.rank)}
                </span>
                <RankingAvatar
                  key={entry.avatarUrl ?? entry.userId}
                  entry={entry}
                  large
                />
                <div className={styles.podiumName}>
                  <span title={entry.username}>{entry.username}</span>
                  <strong>
                    {number.format(entry.solvedProblemCount)} <small>bài</small>
                  </strong>
                  <small>
                    {number.format(entry.acceptedSolutionCount)} Accepted
                  </small>
                </div>
                <span className={styles.podiumBase} aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
        {compact.length > 0 && (
          <ol
            className={styles.compactList}
            aria-label="Tóm tắt thứ hạng trang hiện tại"
          >
            {compact.map((entry) => (
              <li key={entry.userId}>
                <span className={styles.compactRank}>{entry.rank}</span>
                <RankingAvatar
                  key={entry.avatarUrl ?? entry.userId}
                  entry={entry}
                />
                <span className={styles.compactName}>{entry.username}</span>
                <span className={styles.compactCounts}>
                  <span>
                    Bài giải:{" "}
                    <strong>{number.format(entry.solvedProblemCount)}</strong>
                  </span>
                  <span>
                    Accepted:{" "}
                    <strong>
                      {number.format(entry.acceptedSolutionCount)}
                    </strong>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
        {board.phase === "ready" && !board.data?.items.length && (
          <p className={styles.subtle}>
            Chưa có người học trong trang đang chọn.
          </p>
        )}
        {!!board.data?.items.length && (
          <button
            type="button"
            className={styles.showMore}
            onClick={() => changeExpanded(true)}
          >
            Show More<span className="sr-only"> — mở rộng bảng xếp hạng</span>
          </button>
        )}
      </aside>
      <section className={styles.board} aria-labelledby="ranking-heading">
        <div className={styles.viewBar}>
          <div
            className={styles.viewSwitch}
            role="group"
            aria-label="Chọn nội dung xếp hạng"
          >
            <button
              type="button"
              lang="en"
              aria-pressed={panel === "ranking"}
              aria-controls="global-ranking-results"
              onClick={() => onPanel("ranking")}
            >
              Ranking
            </button>
            <button
              type="button"
              lang="en"
              aria-pressed={panel === "me"}
              aria-controls="personal-rank-panel"
              onClick={() => onPanel("me")}
            >
              My Ranking
            </button>
          </div>
          {expanded && (
            <button
              type="button"
              className={styles.collapse}
              onClick={() => changeExpanded(false)}
            >
              Thu gọn
            </button>
          )}
        </div>
        <div className={styles.tableHeader}>
          <div>
            <h2 id="ranking-heading" ref={heading} tabIndex={-1} lang="en">
              {panel === "ranking" ? "Global Ranking" : "My Ranking"}
            </h2>
            {board.data && panel === "ranking" && (
              <p>Tổng số người học: {number.format(board.data.total)}</p>
            )}
          </div>
        </div>
        <section
          id="personal-rank-panel"
          className={`${styles.personal} ${panel === "me" ? styles.personalExpanded : ""}`}
          aria-labelledby="my-rank-heading"
        >
          <div>
            <h3 id="my-rank-heading">Vị trí của bạn</h3>
            {panel === "me" && (
              <p className={styles.subtle}>
                Cùng khoảng thời gian và gói bài đang chọn.
              </p>
            )}
          </div>
          {me.phase === "loading" && (
            <p role="status">Đang tải thứ hạng của bạn…</p>
          )}
          {me.phase === "guest" && (
            <p>
              <Link href="/login">Đăng nhập</Link> để xem thứ hạng cá nhân.
            </p>
          )}
          {me.phase === "error" && (
            <Failure error={me.error} retry={() => retry("me")} />
          )}
          {me.phase === "ready" &&
            (me.data?.entry ? (
              <div className={styles.personalResult}>
                <Entry entry={me.data.entry} />
                {outside && (
                  <p className={styles.subtle}>
                    Bạn nằm ngoài trang đang xem. Thứ hạng này do máy chủ cung
                    cấp.
                  </p>
                )}
              </div>
            ) : (
              <p>
                Bạn chưa có bài giải Accepted trong bộ lọc này.{" "}
                <Link href="/problems">Chọn bài để luyện tập</Link>.
              </p>
            ))}
        </section>
        <div
          id="global-ranking-results"
          hidden={panel !== "ranking"}
          aria-busy={board.phase === "loading"}
        >
          {board.phase === "loading" && (
            <p className={styles.message} role="status">
              Đang tải bảng xếp hạng…
            </p>
          )}
          {board.phase === "guest" && (
            <div className={styles.message}>
              <p>
                Khách được xem trang đầu của Tất cả thời gian, tối đa 50 người
                học.
              </p>
              <p>
                <Link href="/login">Đăng nhập</Link> để xem tuần, tháng hoặc các
                trang tiếp theo.
              </p>
              <Link
                href={boardHref({ ...query, scope: "all", page: 1, size: 50 })}
              >
                Xem bảng xếp hạng công khai
              </Link>
            </div>
          )}
          {board.phase === "error" && (
            <Failure error={board.error} retry={() => retry("board")} />
          )}
          {board.phase === "ready" && board.data && (
            <>
              {board.data.periodStart && board.data.periodEnd && (
                <p className={styles.period}>
                  Khoảng UTC:{" "}
                  {new Date(board.data.periodStart).toLocaleString("vi-VN", {
                    timeZone: "UTC",
                  })}{" "}
                  →{" "}
                  {new Date(board.data.periodEnd).toLocaleString("vi-VN", {
                    timeZone: "UTC",
                  })}{" "}
                  (không gồm mốc kết thúc).
                </p>
              )}
              {board.data.items.length ? (
                <table className={styles.table}>
                  <caption className="sr-only">
                    Xếp theo số bài đã giải, sau đó số lời giải Accepted. Đồng
                    hạng có khoảng trống.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Hạng</th>
                      <th scope="col">Người học</th>
                      <th scope="col">Bài đã giải</th>
                      <th scope="col">Lời giải Accepted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.data.items.map((entry) => (
                      <tr
                        key={entry.userId}
                        className={
                          entry.userId === user?.id ? styles.current : undefined
                        }
                      >
                        <td>
                          <span
                            className={styles.rankBadge}
                            data-rank={entry.rank <= 3 ? entry.rank : undefined}
                          >
                            {number.format(entry.rank)}
                          </span>
                        </td>
                        <th scope="row">
                          <span className={styles.userCell}>
                            <RankingAvatar
                              key={entry.avatarUrl ?? entry.userId}
                              entry={entry}
                            />
                            <span className={styles.username}>
                              {entry.username}
                            </span>
                            {entry.userId === user?.id && (
                              <span className={styles.you}>Bạn</span>
                            )}
                          </span>
                        </th>
                        <td>{number.format(entry.solvedProblemCount)}</td>
                        <td>{number.format(entry.acceptedSolutionCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.message}>
                  <h3>
                    {query.page > pages
                      ? "Trang này không có kết quả"
                      : "Chưa có thứ hạng"}
                  </h3>
                  <p>
                    {query.page > pages
                      ? "Số trang có thể đã thay đổi. Hãy quay về trang đầu."
                      : "Chưa có người học giải được bài trong bộ lọc này."}
                  </p>
                  {query.page > 1 && (
                    <Link href={boardHref({ ...query, page: 1 })}>
                      Về trang đầu
                    </Link>
                  )}
                </div>
              )}
              <nav
                className={styles.pagination}
                aria-label="Phân trang bảng xếp hạng"
              >
                <span>
                  Trang {number.format(query.page)} / {number.format(pages)}
                </span>
                <div>
                  <button
                    type="button"
                    aria-label="Trang trước"
                    title="Trang trước"
                    disabled={query.page <= 1}
                    onClick={() =>
                      router.push(
                        boardHref({ ...query, page: query.page - 1 }),
                        { scroll: false },
                      )
                    }
                  >
                    <Icon name="chevronLeft" />
                    <span className="sr-only">Trang trước</span>
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={styles.pageNumber}
                      aria-label={`Trang ${page}`}
                      aria-current={page === query.page ? "page" : undefined}
                      onClick={() =>
                        router.push(boardHref({ ...query, page }), {
                          scroll: false,
                        })
                      }
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Trang sau"
                    title="Trang sau"
                    disabled={query.page >= pages}
                    onClick={() =>
                      router.push(
                        boardHref({ ...query, page: query.page + 1 }),
                        { scroll: false },
                      )
                    }
                  >
                    <Icon name="chevronRight" />
                    <span className="sr-only">Trang sau</span>
                  </button>
                </div>
              </nav>
            </>
          )}
        </div>
        {panel === "me" && (
          <p className={styles.personalHint}>
            Thứ hạng cá nhân dùng cùng bộ lọc với Global Ranking.{" "}
            <Link href="/problems">Tiếp tục luyện giải</Link>.
          </p>
        )}
      </section>
    </div>
  );
}

function PackageFilter({
  query,
  onApply,
}: {
  query: BoardQuery;
  onApply: (value: string) => void;
}) {
  const api = useApiClient();
  const [value, setValue] = useState(query.package);
  const [packages, setPackages] = useState<PackageModel[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void withDeadline(
      controller,
      () => api.catalog.getLanding({ signal: controller.signal }),
      15000,
    )
      .then((data) => {
        if (!controller.signal.aborted) setPackages(data.featuredPackages);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [api]);
  return (
    <form
      className={styles.packageForm}
      onSubmit={(event) => {
        event.preventDefault();
        onApply(value.trim());
      }}
    >
      <label htmlFor="board-package">Gói bài (slug)</label>
      <div>
        <input
          id="board-package"
          list="board-package-options"
          value={value}
          maxLength={200}
          placeholder="Tất cả gói bài"
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit">Áp dụng</button>
      </div>
      <datalist id="board-package-options">
        {packages.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.name}
          </option>
        ))}
      </datalist>
      <p className={styles.subtle}>
        Nhập slug bất kỳ hoặc chọn gợi ý gói nổi bật. Để trống để xem tất cả.
      </p>
    </form>
  );
}

export function LeaderboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.toString();
  const query = useMemo(
    () => parseBoardQuery(new URLSearchParams(search)),
    [search],
  );
  const { status, user } = useSession();
  const href = boardHref(query);
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<"ranking" | "me">("ranking");
  function update(patch: Partial<BoardQuery>) {
    router.push(boardHref({ ...query, ...patch, page: 1 }), { scroll: false });
  }
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {process.env.NEXT_PUBLIC_MOCK_MODE === "true" && (
          <p className={styles.mockNotice}>
            <strong>Dữ liệu demo</strong>
            <span>
              Tên và thứ hạng bên dưới là dữ liệu mô phỏng để xem thử, không
              phải tài khoản thật.
            </span>
          </p>
        )}
        <header className={styles.heading}>
          <RankingTrophy />
          <h1 lang="en">Codjingrank Ranking</h1>
          <p>Luyện giải mỗi ngày. Theo dõi thứ hạng của bạn.</p>
        </header>
        <nav
          className={styles.practiceCards}
          aria-label="Khám phá và luyện giải"
        >
          <Link
            href="/packages"
            className={`${styles.practiceCard} ${styles.packageCard}`}
          >
            <span className={styles.cardTag}>Lộ trình</span>
            <PracticeArtwork />
            <span className={styles.cardCaption}>
              <strong>Gói bài tập</strong>
              <span>Luyện tập theo từng cấp độ</span>
            </span>
            <span className={styles.cardArrow} aria-hidden="true">
              →
            </span>
          </Link>
          <Link
            href="/problems"
            className={`${styles.practiceCard} ${styles.problemCard}`}
          >
            <span className={styles.cardTag}>Thực hành</span>
            <PracticeArtwork pair />
            <span className={styles.cardCaption}>
              <strong>Kho bài tập</strong>
              <span>Chọn bài và bắt đầu luyện giải</span>
            </span>
            <span className={styles.cardArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </nav>
        <div className={styles.filters}>
          <div>
            <label htmlFor="board-scope">Khoảng thời gian</label>
            <select
              id="board-scope"
              value={query.scope}
              onChange={(event) =>
                update({ scope: event.target.value as BoardQuery["scope"] })
              }
            >
              {scopes.map((scope) => (
                <option value={scope.value} key={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </div>
          <PackageFilter
            key={query.package}
            query={query}
            onApply={(value) => update({ package: value })}
          />
          <div>
            <label htmlFor="board-size">Số dòng mỗi trang</label>
            <select
              id="board-size"
              value={query.size}
              onChange={(event) => update({ size: Number(event.target.value) })}
            >
              {Array.from(new Set([10, 20, 50, 100, query.size]))
                .sort((a, b) => a - b)
                .map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <SessionNotice />
        {status === "initializing" ? (
          <p role="status">Đang chờ phiên sẵn sàng…</p>
        ) : (
          <Results
            key={`${status}:${user?.id ?? "guest"}:${href}`}
            query={query}
            expanded={expanded}
            onExpand={setExpanded}
            panel={panel}
            onPanel={setPanel}
          />
        )}
        <footer className={styles.notes}>
          <details>
            <summary>Cách tính thứ hạng</summary>
            <p>
              Xếp theo số bài đã giải, sau đó số lời giải Accepted. Người đồng
              hạng có cùng hạng và có khoảng trống ở hạng kế tiếp.
            </p>
            <p>
              Tuần bắt đầu thứ Hai theo UTC; tháng theo lịch UTC. Chỉ tính bài
              có lần giải đầu tiên trong kỳ; số lời giải Accepted của các bài đó
              được tính ở thời điểm hiện tại. Không sử dụng điểm AI.
            </p>
            <p>Dữ liệu có thể cập nhật chậm tối đa 60 giây.</p>
          </details>
        </footer>
      </main>
    </div>
  );
}
