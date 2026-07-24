// Minimal JPEG EXIF reader: extracts DateTimeOriginal (tag 0x9003, falling
// back to DateTime 0x0132) as a naive local "YYYY-MM-DDTHH:mm:ss" string.
// Hand-rolled per the no-small-deps rule; anything unparseable returns null.

export function exifTakenAtLocal(buffer: ArrayBuffer): string | null {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 12 || view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00) return null;
      const size = view.getUint16(offset + 2);
      if (marker === 0xffe1 && offset + 10 <= view.byteLength) {
        const start = offset + 4;
        // "Exif\0\0"
        if (
          view.getUint32(start) === 0x45786966 &&
          view.getUint16(start + 4) === 0
        ) {
          return parseTiff(view, start + 6);
        }
      }
      if (marker === 0xffda) return null; // start of scan — no EXIF ahead
      offset += 2 + size;
    }
    return null;
  } catch {
    return null;
  }
}

function parseTiff(view: DataView, tiff: number): string | null {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);
  if (u16(tiff + 2) !== 42) return null;

  const readAscii = (entry: number): string | null => {
    const count = u32(entry + 4);
    const valueOffset = count <= 4 ? entry + 8 : tiff + u32(entry + 8);
    if (valueOffset + count > view.byteLength) return null;
    let s = "";
    for (let i = 0; i < count - 1; i++) {
      s += String.fromCharCode(view.getUint8(valueOffset + i));
    }
    return s;
  };

  const ifd0 = tiff + u32(tiff + 4);
  let exifIfd = 0;
  let fallback: string | null = null;

  const n = u16(ifd0);
  for (let i = 0; i < n; i++) {
    const entry = ifd0 + 2 + i * 12;
    const tag = u16(entry);
    if (tag === 0x8769) exifIfd = tiff + u32(entry + 8);
    if (tag === 0x0132) fallback = readAscii(entry);
  }

  if (exifIfd) {
    const m = u16(exifIfd);
    for (let i = 0; i < m; i++) {
      const entry = exifIfd + 2 + i * 12;
      if (u16(entry) === 0x9003) {
        return exifToLocalIso(readAscii(entry));
      }
    }
  }
  return exifToLocalIso(fallback);
}

function exifToLocalIso(s: string | null): string | null {
  const m = s?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
}
