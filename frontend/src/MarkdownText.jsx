import React from 'react';

function renderInline(text) {
  if (!text) return null;
  const parts = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/70 text-sky-300 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function MarkdownText({ content }) {
  if (!content) return null;
  const lines = String(content).split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = (idxKey) => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${idxKey}`} className="space-y-1.5 my-2 pl-4 list-disc marker:text-emerald-400">
          {listItems.map((item, i) => (
            <li key={i} className="text-slate-200 leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(idx);
      return;
    }

    if (line.startsWith('### ')) {
      flushList(idx);
      blocks.push(
        <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-sky-300 mt-3 mb-1.5 first:mt-0">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList(idx);
      blocks.push(
        <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1.5 first:mt-0">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else {
      flushList(idx);
      blocks.push(
        <p key={idx} className="text-slate-200 leading-relaxed my-1.5 first:mt-0 last:mb-0">
          {renderInline(line)}
        </p>
      );
    }
  });

  flushList('end');
  return <div className="space-y-1 text-[13px]">{blocks}</div>;
}
