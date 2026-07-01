/**
 * Minimal Markdown + MDX → HTML for the editor live-preview only.
 *
 * This is NOT the production renderer (the marketing site compiles MDX
 * server-side). It gives the author a faithful-enough preview of headings,
 * emphasis, lists, code, links, blockquotes, horizontal rules — AND a styled
 * approximation of the custom MDX blocks (<Stat>, <Callout>, <Pull>) so they
 * don't show up as raw tags while writing. The author is a trusted super-admin.
 */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Escape, then apply inline markdown (code / bold / italic / links).
function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

// Pull key="value" attributes out of an MDX opening tag.
function attrs(tag: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag)) !== null) map[m[1]] = m[2];
  return map;
}

function statBlock(tag: string): string {
  const a = attrs(tag);
  return (
    `<div style="border:1px solid #ecdfd9;border-radius:12px;padding:14px 16px;margin:14px 0;background:#fff7f4">` +
    `<div style="font-size:1.6rem;font-weight:700;color:#e0552f;line-height:1.1">${esc(a.value || "")}</div>` +
    `<div style="font-size:0.8rem;color:#8a7d76;margin-top:2px">${esc(a.label || "")}</div>` +
    `</div>`
  );
}

function calloutBlock(tag: string, body: string): string {
  const a = attrs(tag);
  const title = a.title ? `<div style="font-weight:700;color:#e0552f;margin-bottom:4px">${esc(a.title)}</div>` : "";
  return (
    `<div style="border-left:3px solid #e0552f;border-radius:8px;padding:10px 14px;margin:14px 0;background:#fbf3f0">` +
    title +
    `<div style="color:#41372f">${inline(body.trim())}</div>` +
    `</div>`
  );
}

function pullBlock(tag: string, body: string): string {
  const a = attrs(tag);
  const cite = a.cite ? `<div style="font-size:0.78rem;color:#8a7d76;margin-top:6px">— ${esc(a.cite)}</div>` : "";
  return (
    `<blockquote style="border:none;font-size:1.15rem;font-style:italic;color:#2b241f;margin:16px 0;padding:0">` +
    `${inline(body.trim())}${cite}` +
    `</blockquote>`
  );
}

export function renderMarkdown(src: string): string {
  const lines = (src ?? "").split("\n");
  const out: string[] = [];
  let inCode = false;
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Fenced code
    if (line.startsWith("```")) {
      flushPara();
      closeList();
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        out.push('<pre class="md-pre"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(esc(raw));
      continue;
    }

    // --- Custom MDX blocks ---------------------------------------------
    const trimmed = line.trim();
    if (/^<Stat\b/.test(trimmed)) {
      flushPara();
      closeList();
      out.push(statBlock(trimmed));
      continue;
    }
    if (/^<Callout\b/.test(trimmed) || /^<Pull\b/.test(trimmed)) {
      flushPara();
      closeList();
      const isCallout = /^<Callout\b/.test(trimmed);
      const closeTag = isCallout ? "</Callout>" : "</Pull>";
      const openTag = trimmed;
      // Collect body lines until the closing tag.
      const bodyLines: string[] = [];
      // Same-line close? e.g. <Pull cite="x">quote</Pull>
      const sameLine = trimmed.indexOf(closeTag);
      if (sameLine !== -1) {
        const inner = trimmed.slice(trimmed.indexOf(">") + 1, sameLine);
        out.push(isCallout ? calloutBlock(openTag, inner) : pullBlock(openTag, inner));
        continue;
      }
      // Anything after the '>' on the opening line is body too.
      const afterOpen = trimmed.slice(trimmed.indexOf(">") + 1);
      if (afterOpen.trim()) bodyLines.push(afterOpen);
      i++;
      while (i < lines.length && !lines[i].includes(closeTag)) {
        bodyLines.push(lines[i]);
        i++;
      }
      const body = bodyLines.join(" ");
      out.push(isCallout ? calloutBlock(openTag, body) : pullBlock(openTag, body));
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushPara();
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara();
      closeList();
      out.push("<hr />");
      continue;
    }

    // Heading
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushPara();
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      flushPara();
      closeList();
      out.push(`<blockquote>${inline(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    // Lists
    const ul = /^[-*]\s+(.*)$/.exec(trimmed);
    const ol = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (ul || ol) {
      flushPara();
      const want: "ul" | "ol" = ul ? "ul" : "ol";
      if (listType !== want) {
        closeList();
        out.push(`<${want}>`);
        listType = want;
      }
      out.push(`<li>${inline((ul ?? ol)![1])}</li>`);
      continue;
    }

    closeList();
    para.push(trimmed);
  }

  flushPara();
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}
