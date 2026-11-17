import Markdown from "react-markdown";
import { memo } from "react";
import styles from "./forum.module.css";

// Forum content is untrusted. HTML is skipped and remote images are not fetched;
// link URLs still pass react-markdown's default safe-protocol transform.
export const ForumMarkdown = memo(function ForumMarkdown({
  children,
}: {
  children: string;
}) {
  return (
    <div className={styles.markdown}>
      <Markdown
        skipHtml
        components={{
          img: ({ alt }) => <span>{alt || "Hình minh họa"}</span>,
          a: ({ href, children: label }) => (
            <a href={href} rel="noopener noreferrer nofollow" target="_blank">
              {label}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
});
