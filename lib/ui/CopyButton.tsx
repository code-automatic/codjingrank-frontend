"use client";
import { useState } from "react";
import { IconButton } from "./IconButton";

export function CopyButton({
  value,
  label = "Sao chép mã lượt nộp",
}: {
  value: string;
  label?: string;
}) {
  const [result, setResult] = useState("");
  return (
    <span className="copy-control">
      <IconButton
        icon={result === "Đã sao chép" ? "check" : "copy"}
        label={label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setResult("Đã sao chép");
          } catch {
            setResult(
              "Không sao chép được. Bạn có thể chọn mã và sao chép thủ công.",
            );
          }
        }}
      />
      <span className="sr-only" role="status">
        {result}
      </span>
    </span>
  );
}
