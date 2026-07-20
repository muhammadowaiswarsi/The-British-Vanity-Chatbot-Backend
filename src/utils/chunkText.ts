/**
 * Split long text into overlapping chunks, preferring paragraph and sentence boundaries.
 */
export const chunkText = (text: string, chunkSize = 800, overlap = 100): string[] => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const rawChunks: string[] = [];
  let current = '';

  const pushChunk = (chunk: string): void => {
    const trimmed = chunk.trim();
    if (trimmed) rawChunks.push(trimmed);
  };

  const splitLongBlock = (block: string): string[] => {
    const sentencePattern = /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g;
    const sentences = block.match(sentencePattern)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [block];

    const parts: string[] = [];
    let buffer = '';

    for (const sentence of sentences) {
      const candidate = buffer ? `${buffer} ${sentence}` : sentence;

      if (candidate.length > chunkSize && buffer) {
        parts.push(buffer.trim());
        buffer = sentence;
      } else {
        buffer = candidate;
      }
    }

    if (buffer.trim()) {
      parts.push(buffer.trim());
    }

    return parts.length ? parts : [block];
  };

  for (const paragraph of paragraphs) {
    const blocks = paragraph.length > chunkSize ? splitLongBlock(paragraph) : [paragraph];

    for (const block of blocks) {
      const candidate = current ? `${current}\n\n${block}` : block;

      if (candidate.length <= chunkSize) {
        current = candidate;
      } else {
        if (current) pushChunk(current);
        current = block;
      }
    }
  }

  if (current) pushChunk(current);

  if (overlap <= 0 || rawChunks.length <= 1) {
    return rawChunks;
  }

  const overlapped: string[] = [rawChunks[0]];

  for (let index = 1; index < rawChunks.length; index += 1) {
    const previous = rawChunks[index - 1];
    const overlapText = previous.slice(Math.max(0, previous.length - overlap)).trim();
    overlapped.push(`${overlapText}\n\n${rawChunks[index]}`.trim());
  }

  return overlapped;
};
