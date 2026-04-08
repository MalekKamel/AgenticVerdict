import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";

import { computePngMismatchRatio } from "./visual-regression";

function solidPng(width: number, height: number, rgba: [number, number, number, number]): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      png.data[i] = rgba[0];
      png.data[i + 1] = rgba[1];
      png.data[i + 2] = rgba[2];
      png.data[i + 3] = rgba[3];
    }
  }
  return PNG.sync.write(png);
}

describe("computePngMismatchRatio", () => {
  it("returns 0 for identical buffers", () => {
    const a = solidPng(8, 8, [200, 10, 30, 255]);
    const ratio = computePngMismatchRatio(a, a, { threshold: 0.1 });
    expect(ratio).toBe(0);
  });

  it("returns a positive ratio when pixels differ", () => {
    const a = solidPng(8, 8, [200, 10, 30, 255]);
    const b = solidPng(8, 8, [10, 200, 30, 255]);
    const ratio = computePngMismatchRatio(a, b, { threshold: 0.05 });
    expect(ratio).toBeGreaterThan(0.5);
  });

  it("throws on dimension mismatch", () => {
    const a = solidPng(4, 4, [1, 2, 3, 255]);
    const b = solidPng(5, 5, [1, 2, 3, 255]);
    expect(() => computePngMismatchRatio(a, b)).toThrow(/dimensions/);
  });
});
