"use client";
import { useRef, useState } from "react";
import { Icon } from "@/lib/ui/Icon";
export function StorePage() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState("");
  return (
    <main className="platform-route-main">
      <div className="platform-demo-banner">
        <span className="platform-demo">Demo giao diện</span>Gói dịch vụ và giá
        bên dưới chỉ minh họa thiết kế. Không thu tiền hoặc thay đổi quyền tài
        khoản.
      </div>
      <header className="platform-store-hero">
        <h1>
          Thêm không gian cho
          <br />
          những bước tiến lớn.
        </h1>
        <p>
          Khám phá ý tưởng Codjingrank Pro. Các quyền lợi bên dưới là đề xuất
          cho phiên bản tương lai.
        </p>
      </header>
      <div className="platform-pricing">
        {[
          {
            name: "Pro theo tháng",
            price: "99.000₫",
            period: "tháng",
            description: "Giá mẫu theo tháng, không tự động gia hạn.",
          },
          {
            name: "Pro theo năm",
            price: "79.000₫",
            period: "tháng",
            description: "Tổng mẫu 948.000₫/năm. Chưa mở bán.",
          },
        ].map((item, i) => (
          <article className="platform-plan" key={item.name}>
            <div className="platform-panel-title">
              <h2>{item.name}</h2>
              {i === 1 && <span className="platform-demo">Gói mẫu</span>}
            </div>
            <p className="platform-price">
              {item.price}
              <small> / {item.period}</small>
            </p>
            <p>{item.description}</p>
            <ul>
              <li>Lộ trình luyện tập chuyên sâu — dự kiến</li>
              <li>Bộ bài phỏng vấn theo chủ đề — dự kiến</li>
              <li>Nhận xét lời giải mở rộng — dự kiến</li>
            </ul>
            <button
              className="platform-primary"
              onClick={() => {
                setPlan(item.name);
                dialog.current?.showModal();
              }}
            >
              Trải nghiệm đăng ký demo <Icon name="arrowUpRight" />
            </button>
          </article>
        ))}
      </div>
      <dialog className="platform-store-dialog" ref={dialog}>
        <h2>{plan}</h2>
        <p>
          Đây là bước xác nhận minh họa. Codjingrank chưa mở thanh toán hoặc
          kích hoạt gói Pro; tài khoản và số dư của bạn không thay đổi.
        </p>
        <form method="dialog">
          <button className="platform-primary" autoFocus>
            Đã hiểu, đóng demo
          </button>
        </form>
      </dialog>
    </main>
  );
}
