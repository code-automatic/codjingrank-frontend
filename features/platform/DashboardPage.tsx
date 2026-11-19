"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import {
  type PackageModel,
  type ForumPostSummaryModel,
  errorText,
} from "@/lib/api";
import { Icon } from "@/lib/ui/Icon";
import { PracticeAside } from "./PracticeAside";

export function DashboardPage() {
  const router = useRouter();
  const { status, user } = useSession();
  const api = useApiClient();
  const [packages, setPackages] = useState<PackageModel[] | null>(null);
  const [posts, setPosts] = useState<ForumPostSummaryModel[] | null>(null);
  const [errors, setErrors] = useState({ packages: "", posts: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    api.catalog
      .listPackages({ page: 1, size: 4 }, options)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPackages(data.items);
          setErrors((current) => ({ ...current, packages: "" }));
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setErrors((current) => ({ ...current, packages: errorText(error) }));
      });
    api.community
      .listPosts({ page: 1, size: 5, sort: "newest" }, options)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPosts(data.items);
          setErrors((current) => ({ ...current, posts: "" }));
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setErrors((current) => ({ ...current, posts: errorText(error) }));
      });
    return () => controller.abort();
  }, [api, status, user?.id, retry]);
  if (status !== "authenticated" || !user)
    return (
      <main className="platform-route-main">
        <SessionNotice />
      </main>
    );
  return (
    <main className="platform-route-main">
      <header className="platform-welcome">
        <div>
          <h1>Chào {user.fullName || user.username}, tiếp tục nhé.</h1>
          <p>Một bài giải mới. Một bước tiến của bạn.</p>
        </div>
        <Link href="/problems" className="platform-primary">
          Bắt đầu luyện tập <Icon name="play" />
        </Link>
      </header>
      {process.env.NEXT_PUBLIC_MOCK_MODE === "true" && (
        <p className="platform-demo-banner">
          <span className="platform-demo">Dữ liệu demo</span>Thông tin luyện tập
          và cộng đồng đang được cung cấp từ môi trường mô phỏng.
        </p>
      )}
      <div className="platform-dashboard-layout">
        <div>
          <div className="platform-feature-grid">
            <Link href="/packages" className="platform-feature">
              <h2>
                Chọn hướng đi.
                <br />
                Giải từng bước.
              </h2>
              <p>Các gói bài sắp xếp theo cấp độ, mở khóa theo tiến độ.</p>
              <span>
                Khám phá lộ trình <Icon name="arrowUpRight" />
              </span>
              <Icon name="layers" />
            </Link>
            <Link href="/forum" className="platform-feature">
              <h2>Cùng nhau tìm ra cách giải.</h2>
              <span>
                Đến cộng đồng <Icon name="arrowUpRight" />
              </span>
              <Icon name="message" />
            </Link>
          </div>
          <section>
            <div className="platform-section-head">
              <h2>Lộ trình cho buổi học tiếp theo</h2>
              <Link href="/packages">
                Xem tất cả <Icon name="arrowUpRight" />
              </Link>
            </div>
            {errors.packages ? (
              <p role="alert">
                {errors.packages}{" "}
                <button onClick={() => setRetry((value) => value + 1)}>
                  Thử lại
                </button>
              </p>
            ) : packages ? (
              packages.length ? (
                <ul className="platform-package-links">
                  {packages.map((pkg) => (
                    <li key={pkg.id}>
                      <Link href={`/packages/${pkg.slug}`}>
                        <span className="platform-feed-icon">
                          <Icon name="book" />
                        </span>
                        <div>
                          <strong>{pkg.name}</strong>
                          <p>
                            {pkg.totalProblems} bài tập ·{" "}
                            {pkg.description || "Luyện giải theo từng cấp độ"}
                          </p>
                        </div>
                        <Icon name="chevronRight" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Chưa có lộ trình được xuất bản.</p>
              )
            ) : (
              <p role="status">Đang tải lộ trình…</p>
            )}
          </section>
          <section>
            <div className="platform-section-head">
              <h2>Mới trong cộng đồng</h2>
              <Link href="/forum">
                Đọc thảo luận <Icon name="arrowUpRight" />
              </Link>
            </div>
            {errors.posts ? (
              <p role="alert">
                {errors.posts}{" "}
                <button onClick={() => setRetry((value) => value + 1)}>
                  Thử lại
                </button>
              </p>
            ) : posts ? (
              posts.length ? (
                <ul className="platform-feed">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <span className="platform-feed-icon">
                        <Icon name="message" />
                      </span>
                      <div>
                        <small>
                          {post.author.displayName} ·{" "}
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </small>
                        <h3>
                          <Link href={`/forum/${post.id}`}>{post.title}</Link>
                        </h3>
                        <p>
                          {post.likeCount} lượt thích · {post.commentCount} bình
                          luận · {post.viewCount} lượt xem
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Chưa có thảo luận.{" "}
                  <Link href="/forum/new">Mở một chủ đề mới</Link>.
                </p>
              )
            ) : (
              <p role="status">Đang tải thảo luận…</p>
            )}
          </section>
        </div>
        <aside className="platform-dashboard-aside">
          <PracticeAside />
        </aside>
      </div>
    </main>
  );
}
