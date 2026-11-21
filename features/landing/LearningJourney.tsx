"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/lib/ui/Icon";
import styles from "./journey.module.css";

const steps: {
  title: string;
  description: string;
  action: string;
  href: string;
  icon: IconName;
}[] = [
  {
    title: "Tạo tài khoản",
    description: "Lưu tiến độ và bản nháp trong không gian của bạn.",
    action: "Đăng ký",
    href: "/register",
    icon: "user",
  },
  {
    title: "Chọn một bài",
    description: "Chọn chủ đề phù hợp, bắt đầu từ cấp đang mở.",
    action: "Tìm bài tập",
    href: "/problems",
    icon: "layers",
  },
  {
    title: "Thử cách giải",
    description: "Viết code, chạy mẫu, nộp bài và đọc kết quả.",
    action: "Mở bài mẫu",
    href: "/problems/sum-two",
    icon: "code",
  },
  {
    title: "Nhìn lại tiến bộ",
    description: "Xem bài đã giải và vị trí trên bảng xếp hạng.",
    action: "Xem thứ hạng",
    href: "/leaderboard",
    icon: "trophy",
  },
];

export function LearningJourney() {
  return (
    <section
      id="lo-trinh"
      className={styles.journey}
      aria-labelledby="journey-title"
      data-reveal
    >
      <div className={styles.introduction}>
        <h2 id="journey-title">
          Có lộ trình.
          <br />
          <span>Có bước tiếp theo.</span>
        </h2>
        <div>
          <p>
            Chọn một chủ đề. Thử một cách giải. Từng bước nhỏ tạo nên hành trình
            của riêng bạn.
          </p>
          <Link href="/packages" className={styles.discover}>
            Khám phá gói bài tập
            <Icon name="arrowUpRight" />
          </Link>
        </div>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <ol
              key={copy}
              className={styles.sequence}
              aria-label={copy === 0 ? "Bốn bước luyện tập" : undefined}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Link
                    className={styles.card}
                    href={step.href}
                    tabIndex={copy === 1 ? -1 : undefined}
                    onMouseDown={
                      copy === 1 ? (event) => event.preventDefault() : undefined
                    }
                  >
                    <div className={styles.marker}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <Icon name={step.icon} size={24} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                    <span className={styles.cardAction}>
                      {step.action}
                      <Icon name="arrowUpRight" size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ))}
        </div>
      </div>
      <div className={styles.foot}>
        <span>Một bài hôm nay. Một cách nghĩ mới ngày mai.</span>
        <Icon name="code" size={24} />
      </div>
    </section>
  );
}
