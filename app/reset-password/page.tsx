import { Suspense } from "react";
import { PasswordRecovery } from "@/features/auth/PasswordRecovery";
export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <main className="container" role="status">
          Đang tải…
        </main>
      }
    >
      <PasswordRecovery reset />
    </Suspense>
  );
}
