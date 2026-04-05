import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ParagraphChild } from "docx";
import { HTMLElement, Node as HtmlNode, NodeType, parse, TextNode } from "node-html-parser";

import type { ReportGenerationContext } from "./types";

const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "template"]);

function normalizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function parseSpan(attr: string | undefined, fallback: number): number {
  if (!attr) {
    return fallback;
  }
  const n = Number.parseInt(attr, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function collectInlineRuns(node: HtmlNode, bold: boolean, italic: boolean): ParagraphChild[] {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const t = normalizeText((node as TextNode).rawText ?? "");
    if (!t) {
      return [];
    }
    return [new TextRun({ text: t, bold, italics: italic })];
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return [];
  }
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "br") {
    return [new TextRun({ text: "", break: 1 })];
  }
  const nextBold = bold || tag === "strong" || tag === "b";
  const nextItalic = italic || tag === "em" || tag === "i";
  if (tag === "a") {
    const href = el.getAttribute("href")?.trim() ?? "";
    const inner = el.childNodes.flatMap((c) => collectInlineRuns(c, nextBold, nextItalic));
    if (!href || href.startsWith("javascript:")) {
      return inner;
    }
    const linkChildren: ParagraphChild[] =
      inner.length > 0 ? inner : [new TextRun({ text: href, style: "Hyperlink" })];
    return [
      new ExternalHyperlink({
        link: href,
        children: linkChildren,
      }),
    ];
  }
  if (tag === "code" || tag === "span" || tag === "small") {
    return el.childNodes.flatMap((c) => collectInlineRuns(c, nextBold, nextItalic));
  }
  return el.childNodes.flatMap((c) => collectInlineRuns(c, nextBold, nextItalic));
}

function paragraphFromElement(
  el: HTMLElement,
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel],
): Paragraph {
  const runs = el.childNodes.flatMap((c) => collectInlineRuns(c, false, false));
  if (runs.length === 0) {
    return new Paragraph({ text: "", heading });
  }
  return new Paragraph({ children: runs, heading });
}

function tryDataUriImageRun(src: string): ImageRun | undefined {
  const m = /^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/i.exec(src.trim());
  if (!m) {
    return undefined;
  }
  const kind = m[1].toLowerCase();
  const type = kind === "jpg" ? "jpg" : (kind as "png" | "gif" | "bmp");
  const data = Buffer.from(m[2], "base64");
  return new ImageRun({
    type,
    data,
    transformation: { width: 320, height: 200 },
  });
}

function blockFromElement(el: HTMLElement): (Paragraph | Table)[] {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) {
    return [];
  }
  if (tag === "table") {
    return [htmlTableToDocx(el)];
  }
  if (tag === "ul" || tag === "ol") {
    return listToParagraphs(el, tag === "ul");
  }
  if (tag === "img") {
    const src = el.getAttribute("src") ?? "";
    const img = tryDataUriImageRun(src);
    if (!img) {
      return [];
    }
    return [new Paragraph({ children: [img] })];
  }
  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    const map = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ] as const;
    return [paragraphFromElement(el, map[level - 1])];
  }
  if (
    tag === "p" ||
    tag === "div" ||
    tag === "section" ||
    tag === "article" ||
    tag === "header" ||
    tag === "footer"
  ) {
    const textOnly = el.childNodes.every(
      (c) =>
        c.nodeType === NodeType.TEXT_NODE ||
        (c.nodeType === NodeType.ELEMENT_NODE &&
          SKIP_TAGS.has((c as HTMLElement).tagName.toLowerCase())),
    );
    if (textOnly) {
      const t = normalizeText(el.textContent ?? "");
      return t ? [new Paragraph({ text: t })] : [];
    }
    const out: (Paragraph | Table)[] = [];
    for (const child of el.childNodes) {
      out.push(...nodeToBlocks(child));
    }
    return out;
  }
  if (tag === "br") {
    return [new Paragraph({ text: "" })];
  }
  const t = normalizeText(el.textContent ?? "");
  return t ? [new Paragraph({ text: t })] : [];
}

function listToParagraphs(list: HTMLElement, isUl: boolean): Paragraph[] {
  const items = list.childNodes.filter(
    (n): n is HTMLElement =>
      n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName.toLowerCase() === "li",
  );
  const out: Paragraph[] = [];
  let olIndex = 1;
  for (const li of items) {
    const runs = li.childNodes.flatMap((c) => collectInlineRuns(c, false, false));
    const fallback = normalizeText(li.textContent ?? "") || " ";
    if (isUl) {
      out.push(
        new Paragraph({
          children: runs.length > 0 ? runs : [new TextRun({ text: fallback })],
          bullet: { level: 0 },
        }),
      );
    } else {
      const prefix = `${olIndex}. `;
      olIndex += 1;
      out.push(
        new Paragraph({
          children:
            runs.length > 0
              ? [new TextRun({ text: prefix }), ...runs]
              : [new TextRun({ text: `${prefix}${fallback}` })],
        }),
      );
    }
  }
  return out;
}

function directCells(tr: HTMLElement): HTMLElement[] {
  return tr.childNodes.filter(
    (n): n is HTMLElement =>
      n.nodeType === NodeType.ELEMENT_NODE &&
      ["td", "th"].includes((n as HTMLElement).tagName.toLowerCase()),
  ) as HTMLElement[];
}

function htmlTableToDocx(table: HTMLElement): Table {
  const trEls = table.querySelectorAll("tr");
  const rows: TableRow[] = [];
  for (const tr of trEls) {
    const cells: TableCell[] = [];
    for (const cell of directCells(tr)) {
      const colspan = parseSpan(cell.getAttribute("colspan"), 1);
      const rowspan = parseSpan(cell.getAttribute("rowspan"), 1);
      const innerBlocks: (Paragraph | Table)[] = [];
      for (const ch of cell.childNodes) {
        innerBlocks.push(...nodeToBlocks(ch));
      }
      const children: (Paragraph | Table)[] =
        innerBlocks.length > 0
          ? innerBlocks
          : [new Paragraph({ text: normalizeText(cell.textContent ?? "") || " " })];
      cells.push(
        new TableCell({
          children,
          columnSpan: colspan > 1 ? colspan : undefined,
          rowSpan: rowspan > 1 ? rowspan : undefined,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      );
    }
    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }));
    }
  }
  if (rows.length === 0) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "" })] })] }),
      ],
    });
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function nodeToBlocks(node: HtmlNode): (Paragraph | Table)[] {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const t = normalizeText((node as TextNode).rawText ?? "");
    return t ? [new Paragraph({ text: t })] : [];
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return [];
  }
  return blockFromElement(node as HTMLElement);
}

function bodyChildrenToBlocks(root: HTMLElement): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const child of root.childNodes) {
    out.push(...nodeToBlocks(child));
  }
  return out;
}

export function buildReportDocumentFromHtml(
  html: string,
  context: ReportGenerationContext,
): Document {
  const docRoot = parse(html, { blockTextElements: { script: true, style: true } });
  const body = docRoot.querySelector("body") ?? docRoot;
  let children = bodyChildrenToBlocks(body);
  if (children.length === 0) {
    children = [new Paragraph({ text: "" })];
  }

  const includeToc = docRoot.querySelector("#report-docx-toc,[data-report-docx-toc]") !== null;
  const headerText = context.templateId;
  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `${context.templateId} · `, size: 16 }),
      new TextRun({ children: [PageNumber.CURRENT] }),
      new TextRun({ text: " / ", size: 16 }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
    ],
  });

  const sectionChildren: (Paragraph | Table | TableOfContents)[] = [];
  if (includeToc) {
    sectionChildren.push(
      new TableOfContents("Table of contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),
    );
  }
  sectionChildren.push(...children);

  return new Document({
    title: context.reportId,
    creator: "AgenticVerdict",
    description: `Tenant ${context.tenantId}`,
    features: {
      updateFields: includeToc,
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: headerText, bold: true })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [footerParagraph],
          }),
        },
        children: sectionChildren,
      },
    ],
  });
}

export async function packDocxFromHtml(
  html: string,
  context: ReportGenerationContext,
): Promise<Uint8Array> {
  const doc = buildReportDocumentFromHtml(html, context);
  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
