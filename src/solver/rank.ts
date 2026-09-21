/** Column indices of J that have no pivot after Gaussian elimination: variables the residuals do not determine. */
export function freeColumns(J: number[][], relTol: number): number[] {
  const M = J.map((row) => row.slice());
  const m = M.length;
  const n = M[0]?.length ?? 0;
  const maxAbs = Math.max(1e-300, ...M.flat().map(Math.abs));
  const tol = relTol * maxAbs;
  const free: number[] = [];
  let rank = 0;
  for (let col = 0; col < n && rank <= m; col++) {
    let piv = -1;
    let best = tol;
    for (let row = rank; row < m; row++)
      if (Math.abs(M[row][col]) > best) {
        best = Math.abs(M[row][col]);
        piv = row;
      }
    if (piv < 0) {
      free.push(col);
      continue;
    }
    [M[rank], M[piv]] = [M[piv], M[rank]];
    for (let row = rank + 1; row < m; row++) {
      const k = M[row][col] / M[rank][col];
      if (k !== 0) for (let c = col; c < n; c++) M[row][c] -= k * M[rank][c];
    }
    rank++;
  }
  return free;
}
