export type NoteFormat = 'bold' | 'italic' | 'bullet' | 'numbered';
export type NoteSelection = { start: number; end: number };
export type NoteToken = { text: string; bold?: boolean; italic?: boolean };

export function applyNoteFormat(text: string, selection: NoteSelection, format: NoteFormat) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  if (format === 'bold' || format === 'italic') {
    const marker = format === 'bold' ? '**' : '*';
    const selected = text.slice(start, end);
    const replacement = `${marker}${selected}${marker}`;
    const cursor = selected ? start + replacement.length : start + marker.length;
    return { text: `${text.slice(0, start)}${replacement}${text.slice(end)}`, selection: { start: cursor, end: cursor } };
  }

  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextBreak = text.indexOf('\n', end);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const replacement = text.slice(lineStart, lineEnd).split('\n').map((line, index) => `${format === 'bullet' ? '- ' : `${index + 1}. `}${line}`).join('\n');
  return {
    text: `${text.slice(0, lineStart)}${replacement}${text.slice(lineEnd)}`,
    selection: { start: lineStart, end: lineStart + replacement.length },
  };
}

export function parseNoteLine(line: string) {
  const list = /^(?:- |(\d+)\. )/.exec(line);
  const content = list ? line.slice(list[0].length) : line;
  const tokens: NoteToken[] = [];
  const pattern = /(\*\*.+?\*\*|\*.+?\*)/g;
  let cursor = 0;
  for (const match of content.matchAll(pattern)) {
    if (match.index > cursor) tokens.push({ text: content.slice(cursor, match.index) });
    const bold = match[0].startsWith('**');
    tokens.push({ text: match[0].slice(bold ? 2 : 1, bold ? -2 : -1), bold, italic: !bold });
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) tokens.push({ text: content.slice(cursor) });
  return { prefix: list ? (list[1] ? `${list[1]}. ` : '• ') : '', tokens: tokens.length ? tokens : [{ text: content }] };
}
