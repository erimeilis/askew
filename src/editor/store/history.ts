export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export const initHistory = <T>(present: T): History<T> => ({ past: [], present, future: [] });

export const push = <T>(h: History<T>, next: T): History<T> => ({
  past: [...h.past, h.present],
  present: next,
  future: [],
});

export const undo = <T>(h: History<T>): History<T> =>
  h.past.length === 0
    ? h
    : {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future],
      };

export const redo = <T>(h: History<T>): History<T> =>
  h.future.length === 0
    ? h
    : { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
