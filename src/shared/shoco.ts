// TypeScript port of shoco - a fast compressor for short strings
// Based on https://ed-von-schleck.github.io/shoco/

import { SHOCO_MODEL } from './shoco_model';

const MIN_CHR = 39;
const MAX_SUCCESSOR_N = 7;

interface Pack {
  word: number;
  bytes_packed: number;
  bytes_unpacked: number;
  offsets: number[];
  masks: number[];
  header_mask: number;
  header: number;
}

const PACKS: Pack[] = [
  { word: 0x80000000, bytes_packed: 1, bytes_unpacked: 2, offsets: [26, 24, 24, 24, 24, 24, 24, 24], masks: [15, 3, 0, 0, 0, 0, 0, 0], header_mask: 0xc0, header: 0x80 },
  { word: 0xc0000000, bytes_packed: 2, bytes_unpacked: 4, offsets: [25, 22, 19, 16, 16, 16, 16, 16], masks: [15, 7, 7, 7, 0, 0, 0, 0], header_mask: 0xe0, header: 0xc0 },
  { word: 0xe0000000, bytes_packed: 4, bytes_unpacked: 8, offsets: [23, 19, 15, 11, 8, 5, 2, 0], masks: [31, 15, 15, 15, 7, 7, 7, 3], header_mask: 0xf0, header: 0xe0 }
];

function decodeHeader(val: number): number {
  let i = -1;
  while ((val & 0x80) !== 0) {
    val <<= 1;
    i++;
  }
  return i;
}

function checkIndices(indices: number[], packN: number): boolean {
  const pack = PACKS[packN];
  for (let i = 0; i < pack.bytes_unpacked; i++) {
    if (indices[i] > pack.masks[i]) return false;
  }
  return true;
}

function findBestEncoding(indices: number[], nConsecutive: number): number {
  for (let p = PACKS.length - 1; p >= 0; p--) {
    if (nConsecutive >= PACKS[p].bytes_unpacked && checkIndices(indices, p)) {
      return p;
    }
  }
  return -1;
}

export function shocoCompress(input: string): Uint8Array {
  const out: number[] = [];
  let inIdx = 0;
  const indices: number[] = new Array(MAX_SUCCESSOR_N + 1).fill(0);

  while (inIdx < input.length) {
    const charCode = input.charCodeAt(inIdx);

    // Find the longest string of known successors
    indices[0] = SHOCO_MODEL.chr_ids_by_chr[charCode];
    let lastChrIndex = indices[0];

    if (lastChrIndex < 0) {
      // Character not in model - output raw
      if (charCode & 0x80) {
        out.push(0x00); // Sentinel for non-ASCII
      }
      out.push(charCode);
      inIdx++;
      continue;
    }

    const rest = input.length - inIdx;
    let nConsecutive = 1;

    for (; nConsecutive <= MAX_SUCCESSOR_N && nConsecutive < rest; nConsecutive++) {
      const currentCharCode = input.charCodeAt(inIdx + nConsecutive);
      const currentIndex = SHOCO_MODEL.chr_ids_by_chr[currentCharCode];

      if (currentIndex < 0) break;

      const successorIndex = SHOCO_MODEL.successor_ids_by_chr_id_and_chr_id[lastChrIndex][currentIndex];
      if (successorIndex < 0) break;

      indices[nConsecutive] = successorIndex;
      lastChrIndex = currentIndex;
    }

    if (nConsecutive < 2) {
      // Can't compress - output raw
      if (charCode & 0x80) {
        out.push(0x00);
      }
      out.push(charCode);
      inIdx++;
      continue;
    }

    const packN = findBestEncoding(indices, nConsecutive);

    if (packN >= 0) {
      const pack = PACKS[packN];
      let code = pack.word;

      for (let i = 0; i < pack.bytes_unpacked; i++) {
        code |= indices[i] << pack.offsets[i];
      }

      // Convert to bytes (big-endian)
      for (let i = 0; i < pack.bytes_packed; i++) {
        out.push((code >>> (24 - i * 8)) & 0xff);
      }

      inIdx += pack.bytes_unpacked;
    } else {
      // Can't pack - output raw
      if (charCode & 0x80) {
        out.push(0x00);
      }
      out.push(charCode);
      inIdx++;
    }
  }

  return new Uint8Array(out);
}

export function shocoDecompress(input: Uint8Array): string {
  const out: string[] = [];
  let inIdx = 0;

  while (inIdx < input.length) {
    const mark = decodeHeader(input[inIdx]);

    if (mark < 0) {
      // Raw byte
      if (input[inIdx] === 0x00) {
        // Sentinel - skip it
        inIdx++;
        if (inIdx >= input.length) break;
      }
      out.push(String.fromCharCode(input[inIdx]));
      inIdx++;
    } else {
      const pack = PACKS[mark];

      // Read packed bytes
      let code = 0;
      for (let i = 0; i < pack.bytes_packed; i++) {
        code = (code << 8) | input[inIdx + i];
      }

      // Unpack the leading char
      const offset0 = pack.offsets[0];
      const mask0 = pack.masks[0];
      let lastChr = SHOCO_MODEL.chrs_by_chr_id[(code >>> offset0) & mask0];
      out.push(lastChr);

      // Unpack the successor chars
      for (let i = 1; i < pack.bytes_unpacked; i++) {
        const offset = pack.offsets[i];
        const mask = pack.masks[i];
        const successorId = (code >>> offset) & mask;
        const chrIdx = lastChr.charCodeAt(0) - MIN_CHR;
        lastChr = SHOCO_MODEL.chrs_by_chr_and_successor_id[chrIdx][successorId];
        out.push(lastChr);
      }

      inIdx += pack.bytes_packed;
    }
  }

  return out.join('');
}
