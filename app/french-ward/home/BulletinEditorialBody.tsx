import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  decodeBulletinBody,
  safeBulletinHref,
} from "./bulletinEditorial";

type Props = {
  body: string;
};

const permittedElements = [
  "p",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "br",
];

export function BulletinEditorialBody({ body }: Props) {
  const content = decodeBulletinBody(body);

  if (content.format === "plain") {
    return (
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
        {content.text}
      </p>
    );
  }

  return (
    <div className="max-w-[72ch] break-words text-[15px] leading-[1.7]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        allowedElements={permittedElements}
        unwrapDisallowed
        urlTransform={(url) => safeBulletinHref(url) ?? ""}
        components={{
          h2: ({ children }) => (
            <h2 className="mb-2 mt-6 text-base font-semibold text-[#293a40]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-[15px] font-semibold text-[#34454a]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-[15px] font-semibold">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-current pl-4 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-5 border-current opacity-25" />
          ),
          a: ({ href, children }) => {
            const safeHref = safeBulletinHref(href);

            if (!safeHref) {
              return <span>{children}</span>;
            }

            return (
              <a
                href={safeHref}
                className="underline underline-offset-4"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content.text}
      </ReactMarkdown>
    </div>
  );
}
