const patterns = [
  {
    type: "EMAIL",

    regex:
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,

    confidence: 0.99,
  },

  {
    type: "PHONE",

    regex:
      /(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)/g,

    confidence: 0.98,
  },

  {
    type: "AADHAAR",

    regex:
      /(?<!\d)(?:\d{4}[\s-]?){2}\d{4}(?!\d)/g,

    confidence: 0.96,
  },

  {
    type: "PAN",

    regex:
      /\b[A-Z]{5}\d{4}[A-Z]\b/g,

    confidence: 0.97,
  },

  {
    type: "ID",

    regex:
      /\b[A-Z]{2,5}[-\s]?\d{4,12}\b/g,

    confidence: 0.88,
  },
];

/*
 * Context-aware name detection.
 *
 * Example:
 * Name: John Doe
 * Employee: John Doe
 * Customer: Alice Smith
 */

const NAME_LABEL_REGEX =
  /\b(?:name|employee|customer|patient|applicant|candidate|owner)\s*[:=-]\s*([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,}){1,3})\b/g;

function detectPII(text) {
  const entities = [];

  /* ---------------- REGEX PATTERNS ---------------- */

  for (const pattern of patterns) {
    for (const match of text.matchAll(
      pattern.regex
    )) {
      entities.push({
        type: pattern.type,

        value: match[0],

        start: match.index,

        end:
          match.index + match[0].length,

        confidence:
          pattern.confidence,
      });
    }
  }

  /* ---------------- LABELLED NAMES ---------------- */

  for (const match of text.matchAll(
    NAME_LABEL_REGEX
  )) {
    const value = match[1];

    const start =
      match.index +
      match[0].indexOf(value);

    entities.push({
      type: "NAME",

      value,

      start,

      end: start + value.length,

      confidence: 0.92,
    });
  }

  /* ---------------- SIMPLE NAME FALLBACK ---------------- */

  const simpleNameRegex =
    /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g;

  for (const match of text.matchAll(
    simpleNameRegex
  )) {
    const value = match[0];

    const before = text.slice(
      Math.max(0, match.index - 20),
      match.index
    );

    const after = text.slice(
      match.index + value.length,
      match.index +
        value.length +
        10
    );

    /*
     * Avoid obvious false positives.
     */

    if (
      /\b(?:email|phone|id|address|city|country)\s*[:=-]?\s*$/i.test(
        before
      )
    ) {
      continue;
    }

    if (
      /\b(?:street|road|avenue|lane)\b/i.test(
        after
      )
    ) {
      continue;
    }

    entities.push({
      type: "NAME",

      value,

      start: match.index,

      end:
        match.index + value.length,

      confidence: 0.85,
    });
  }

  /* ---------------- REMOVE DUPLICATES ---------------- */

  const unique = [];

  const sorted = [...entities].sort(
    (a, b) => {
      if (
        b.confidence !==
        a.confidence
      ) {
        return (
          b.confidence -
          a.confidence
        );
      }

      return (
        b.value.length -
        a.value.length
      );
    }
  );

  for (const entity of sorted) {
    const duplicate = unique.some(
      (item) =>
        item.type === entity.type &&
        item.start === entity.start &&
        item.end === entity.end
    );

    if (duplicate) {
      continue;
    }

    /*
     * Do not keep overlapping
     * detections.
     */

    const overlaps = unique.some(
      (item) =>
        entity.start < item.end &&
        entity.end > item.start
    );

    if (!overlaps) {
      unique.push(entity);
    }
  }

  return unique.sort(
    (a, b) => a.start - b.start
  );
}

module.exports = {
  detectPII,
};