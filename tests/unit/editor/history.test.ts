import { describe, it, expect } from "vitest";
import { push, undo, redo } from "@/editor/store/history";

describe("history", () => {
  it("push/undo/redo", () => {
    let h = { past: [], present: 1, future: [] } as {
      past: number[];
      present: number;
      future: number[];
    };
    h = push(h, 2);
    h = push(h, 3);
    expect(h.past).toEqual([1, 2]);
    h = undo(h);
    expect(h.present).toBe(2);
    expect(h.future).toEqual([3]);
    h = redo(h);
    expect(h.present).toBe(3);
    expect(undo({ past: [], present: 0, future: [] }).present).toBe(0);
    h = undo(h);
    h = push(h, 9);
    expect(h.future).toEqual([]);
  });
});
