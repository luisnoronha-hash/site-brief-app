/**
 * Minimal PNG/JPEG-only dimension reader. Deliberately hand-rolled instead of a
 * general-purpose image library: those parse a dozen formats we never accept
 * (ICNS, JXL, HEIF, ...) via loops that have had unpatched DoS advisories, and a
 * malicious upload can lie about its declared content-type. Limiting parsing to
 * exactly the two formats the upload flow allows keeps that surface closed.
 */

export type ImageDimensions = { width: number; height: number };

function readPngDimensions(buf: Buffer): ImageDimensions | null {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  // IHDR is always the first chunk: length(4) + "IHDR"(4) + width(4) + height(4) ...
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpegDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  // Bounded by buffer length: every branch below advances offset by at least 1,
  // so this can never loop more times than there are bytes in the file.
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // Standalone markers with no length/payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      if (offset + 9 > buf.length) return null;
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }
  return null;
}

/** Returns null if the buffer isn't a recognizable PNG or JPEG (or is truncated/corrupt). */
export function readImageDimensions(buf: Buffer): ImageDimensions | null {
  return readPngDimensions(buf) ?? readJpegDimensions(buf);
}
