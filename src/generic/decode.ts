/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Application.arrayBufferToUTF8String returns no string on iOS when the body has invalid
// UTF-8 (manhwaclub.net injects GBK text into every page), which makes cheerio.load throw.
export function decodeHtml(buffer: ArrayBuffer): string {
  try {
    const text = Application.arrayBufferToUTF8String(buffer) as string | undefined | null;
    if (typeof text === "string") return text;
  } catch {
    // Fall through to the lossy decoders.
  }

  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    } catch {
      // Fall through to the manual decoder.
    }
  }

  return decodeUtf8Lossy(new Uint8Array(buffer));
}

// Follows the WHATWG rule: one U+FFFD per maximal invalid subpart, like TextDecoder.
export function decodeUtf8Lossy(bytes: Uint8Array): string {
  const chunks: string[] = [];
  let units: number[] = [];

  let i = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  while (i < bytes.length) {
    const b0 = bytes[i++]!;
    let cp = 0xfffd;
    let needed = 0;
    let lower = 0x80;
    let upper = 0xbf;

    if (b0 < 0x80) {
      cp = b0;
    } else if (b0 >= 0xc2 && b0 <= 0xdf) {
      needed = 1;
      cp = b0 & 0x1f;
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      needed = 2;
      cp = b0 & 0x0f;
      if (b0 === 0xe0) lower = 0xa0;
      if (b0 === 0xed) upper = 0x9f;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      needed = 3;
      cp = b0 & 0x07;
      if (b0 === 0xf0) lower = 0x90;
      if (b0 === 0xf4) upper = 0x8f;
    }

    if (b0 >= 0x80 && needed === 0) {
      cp = 0xfffd;
    }

    while (needed > 0) {
      const b = bytes[i];
      if (b === undefined || b < lower || b > upper) {
        cp = 0xfffd;
        break;
      }
      cp = (cp << 6) | (b & 0x3f);
      lower = 0x80;
      upper = 0xbf;
      i++;
      needed--;
    }

    if (cp > 0xffff) {
      cp -= 0x10000;
      units.push(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      units.push(cp);
    }
    if (units.length >= 8192) {
      chunks.push(String.fromCharCode(...units));
      units = [];
    }
  }

  chunks.push(String.fromCharCode(...units));
  return chunks.join("");
}
