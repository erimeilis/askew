/** Commits the current input value on Enter, matching PromptBox's Enter-to-commit convention. */
export function commitOnEnter(handler: (v: string) => void) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handler(e.currentTarget.value);
  };
}

/** Same, but only for a value that parses to a finite number. */
export function commitNumberOnEnter(handler: (n: number) => void) {
  return commitOnEnter((v) => {
    const n = Number(v);
    if (Number.isFinite(n)) handler(n);
  });
}
