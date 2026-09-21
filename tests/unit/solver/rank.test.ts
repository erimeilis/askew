import { describe, it, expect } from "vitest";
import { freeColumns } from "@/solver/rank";
describe("freeColumns", () => {
  it("finds columns with no pivot", () => {
    expect(
      freeColumns(
        [
          [1, 0, 0],
          [0, 0, 2],
        ],
        1e-8,
      ),
    ).toEqual([1]);
    expect(
      freeColumns(
        [
          [1, 2],
          [2, 4],
        ],
        1e-8,
      ),
    ).toEqual([1]);
    expect(
      freeColumns(
        [
          [1, 0],
          [0, 1],
        ],
        1e-8,
      ),
    ).toEqual([]);
  });
});
