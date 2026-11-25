import { describe, expect, it } from "vitest";
import {
  avatarTone,
  initials,
  plainExcerpt,
  relativeTime,
} from "@/features/forum/presentation";

describe("community presentation", () => {
  it("uses the displayed name for initials including Vietnamese names", () => {
    expect(initials("Trung Hieu")).toBe("TH");
    expect(initials("Nguyễn Văn An")).toBe("NA");
    expect(initials("")).toBe("C");
  });
  it("keeps avatar tones deterministic and within the palette", () => {
    expect(avatarTone("Trung Hieu")).toBe(avatarTone("Trung Hieu"));
    for (const name of ["A", "B", "Hà", "🙂"])
      expect(avatarTone(name)).toBeGreaterThanOrEqual(0);
    expect(avatarTone("Hà")).toBeLessThan(5);
  });
  it("removes code blocks, image urls, markup and raw HTML from previews", () => {
    expect(
      plainExcerpt(
        "# Cách giải\n**Dùng** [mảng](https://example.com).\n```py\nprint(1)\n```\n![ảnh](image.png)<div>Tiếp tục</div>",
      ),
    ).toBe("Cách giải Dùng mảng. Tiếp tục");
  });
  it("shows relative minutes from the supplied clock", () => {
    expect(
      relativeTime("2026-11-26T00:00:00Z", Date.parse("2026-11-26T00:05:00Z")),
    ).toBe("5 phút trước");
  });
});
