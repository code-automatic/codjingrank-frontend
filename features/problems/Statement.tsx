import Markdown from "react-markdown";

export function Statement({ children }: { children: string }) {
  return (
    <div className="problem-markdown">
      <Markdown
        skipHtml
        components={{
          // Do not fetch remote images from learner-supplied Markdown.
          img: ({ alt }) => <span>{alt || "Hình minh họa"}</span>,
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
