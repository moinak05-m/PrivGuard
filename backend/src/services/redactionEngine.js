const crypto = require("crypto");

function redactText(
  text,
  entities,
  method = "MASK"
) {
  let redactedText = text;

  /*
   * Process from right to left.
   *
   * This is important because replacing
   * something at the beginning would
   * otherwise change the indexes of
   * entities later in the text.
   */

  const sortedEntities = [
    ...entities,
  ].sort(
    (a, b) => b.start - a.start
  );

  for (const entity of sortedEntities) {
    let replacement;

    if (method === "HASH") {
      replacement = createHash(
        entity.value
      );
    } else if (method === "REMOVE") {
      replacement = "";
    } else {
      replacement = `[${entity.type}]`;
    }

    redactedText =
      redactedText.slice(
        0,
        entity.start
      ) +
      replacement +
      redactedText.slice(
        entity.end
      );
  }

  return redactedText;
}

function createHash(value) {
  const hash = crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex")
    .slice(0, 12);

  return `[HASH_${hash}]`;
}

module.exports = {
  redactText,
};