import { test, expect, type Page } from "@playwright/test";
import { STORAGE_CONFIG } from "@/config/storage";

/**
 * Clears any autosaved plan up front, so this test's "clean profile" start never depends on
 * Playwright's per-test browser-context isolation actually holding — it is cleared
 * deliberately, not assumed.
 *
 * This deletes just the autosave key, not the whole database: `indexedDB.deleteDatabase`
 * blocks (and only completes once every open connection to it closes) whenever the app's own
 * connection is already open, which it always is by the time this runs — `page.goto` waits for
 * `load`, well after React's mount effect calls `loadAutosave()`. A blocked delete does not
 * fail, it defers, and it can then land at an arbitrary later point in the test (observed:
 * right after the final reload), wiping data the test just wrote. Opening the database and
 * deleting one key never blocks.
 */
async function clearAutosave(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, storeName, key }) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.addEventListener("upgradeneeded", () => req.result.createObjectStore(storeName));
        req.addEventListener("error", () => reject(req.error as unknown));
        req.addEventListener("success", () => {
          const db = req.result;
          const tx = db.transaction(storeName, "readwrite");
          tx.objectStore(storeName).delete(key);
          tx.addEventListener("complete", () => {
            db.close();
            resolve();
          });
          tx.addEventListener("error", () => {
            db.close();
            reject(tx.error as unknown);
          });
        });
      }),
    {
      dbName: STORAGE_CONFIG.db.name,
      storeName: STORAGE_CONFIG.db.store,
      key: STORAGE_CONFIG.autosaveKey,
    },
  );
}

/**
 * Polls the autosave record directly (bypassing React state) until it contains `needle`.
 *
 * The retry loop runs *inside* `page.evaluate` as a single awaited call, not via
 * `page.waitForFunction`: `waitForFunction`'s polling re-invokes the predicate through CDP, and
 * a predicate whose result depends on IndexedDB request callbacks (rather than a microtask-based
 * promise) was observed to report its first, still-pending read as final — it returned after one
 * poll, milliseconds in, well before the debounced write had happened. One promise that loops
 * internally waits for the real result instead of a CDP round-trip's idea of one.
 */
async function waitForAutosaveToContain(
  page: Page,
  needle: string,
  timeoutMs = 5000,
): Promise<void> {
  const found = await page.evaluate(
    ({ dbName, storeName, key, needle: targetNeedle, timeoutMs: maxWaitMs }) => {
      const readOnce = () =>
        new Promise<boolean>((resolve) => {
          const req = indexedDB.open(dbName);
          req.addEventListener("error", () => resolve(false));
          req.addEventListener("success", () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.close();
              resolve(false);
              return;
            }
            const getReq = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
            getReq.addEventListener("success", () => {
              db.close();
              resolve(typeof getReq.result === "string" && getReq.result.includes(targetNeedle));
            });
            getReq.addEventListener("error", () => {
              db.close();
              resolve(false);
            });
          });
        });
      return (async () => {
        const deadline = performance.now() + maxWaitMs;
        while (performance.now() < deadline) {
          if (await readOnce()) return true;
          await new Promise((r) => setTimeout(r, 50));
        }
        return false;
      })();
    },
    {
      dbName: STORAGE_CONFIG.db.name,
      storeName: STORAGE_CONFIG.db.store,
      key: STORAGE_CONFIG.autosaveKey,
      needle,
      timeoutMs,
    },
  );
  if (!found)
    throw new Error(`autosave never contained ${JSON.stringify(needle)} within ${timeoutMs}ms`);
}

/** Reads the world-space (millimetre) coordinates rendered for the first two floor points. */
async function firstTwoPointCoords(page: Page): Promise<[number, number, number, number]> {
  const points = page.locator(".points circle");
  const [x0, y0, x1, y1] = await Promise.all([
    points.nth(0).getAttribute("cx"),
    points.nth(0).getAttribute("cy"),
    points.nth(1).getAttribute("cx"),
    points.nth(1).getAttribute("cy"),
  ]);
  return [Number(x0), Number(y0), Number(x1), Number(y1)];
}

test("draw a room, measure it, solve, and survive reload with focus and diagnostics intact", async ({
  page,
}) => {
  await page.goto("/");
  await clearAutosave(page);

  const pageErrors: Error[] = [];
  page.on("pageerror", (e) => pageErrors.push(e));

  // 1. Clean profile: starts with an empty plan, no throw.
  await page.reload();
  const svg = page.locator("svg.canvas");
  await expect(svg).toBeVisible();
  await expect(page.locator(".rooms polygon")).toHaveCount(0);
  expect(pageErrors).toHaveLength(0);

  // 2. Room tool, picked by its accessible name — not by position.
  await page.getByRole("button", { name: "Room" }).click();
  const box = (await svg.boundingBox())!;
  const click = (x: number, y: number) => page.mouse.click(box.x + x, box.y + y);
  await click(300, 300);
  await click(700, 300);
  await click(700, 600);
  await click(300, 600);
  await page.keyboard.press("Enter");

  const roomNameInput = page.locator(".prompt input");
  await expect(roomNameInput).toBeFocused();
  // No click into the field first: straight from the keyboard.
  await page.keyboard.type("Kitchen");
  await page.keyboard.press("Enter");

  // 3. The room exists, with a plausible area (sketched as 4000mm x 3000mm = 12 m²).
  await expect(page.locator(".rooms text").first()).toHaveText("Kitchen");
  const areaText = await page.locator(".rooms text").nth(1).textContent();
  const area = Number(areaText?.replace(/[^\d.]/g, ""));
  expect(area).toBeGreaterThan(11.5);
  expect(area).toBeLessThan(12.5);

  // 4. Measure tool: click two of the room's corners, then — again without clicking into the
  // field — type a length that differs from the sketched distance, so a converged solve is the
  // only way the assertion below can pass.
  await page.getByRole("button", { name: "Measure" }).click();
  await click(300, 300);
  await click(700, 300);

  const lengthInput = page.locator(".prompt input");
  // The focus-bug guard: if Canvas.tsx's onPointerDown stops calling preventDefault(), the
  // browser's native mousedown default blurs this input right after the tool opens it, and
  // this assertion goes red.
  await expect(lengthInput).toBeFocused();
  await page.keyboard.type("4500");
  await page.keyboard.press("Enter");

  // 5. The fit actually moved the geometry: the two points' solved coordinates, read straight
  // from the DOM (world millimetres — <PointsLayer> renders inside the world-space <g>), must
  // be 4500mm apart, not the 4000mm they were sketched at.
  const [x0, y0, x1, y1] = await firstTwoPointCoords(page);
  expect(Math.abs(Math.hypot(x1 - x0, y1 - y0) - 4500)).toBeLessThan(1);

  // 6. The measurements panel shows a row for it, with a residual, and a human label —
  // never a raw generated id.
  const row = page.locator(".measurements tbody tr").first();
  await expect(row).toBeVisible();
  const cells = row.locator("td");
  const label = await cells.nth(1).textContent();
  expect(label).not.toMatch(/p_[a-z0-9]+/);
  const residual = await cells.nth(3).textContent();
  expect(residual?.trim()).not.toBe("");

  // 7. Reload: the plan comes back from autosave, diagnostics included — a residual value
  // present, not a blank cell.
  await waitForAutosaveToContain(page, '"value": 4500');
  await page.reload();

  await expect(page.locator(".rooms text").first()).toHaveText("Kitchen");
  const [rx0, ry0, rx1, ry1] = await firstTwoPointCoords(page);
  expect(Math.abs(Math.hypot(rx1 - rx0, ry1 - ry0) - 4500)).toBeLessThan(1);

  const reloadedResidual = await page
    .locator(".measurements tbody tr")
    .first()
    .locator("td")
    .nth(3)
    .textContent();
  expect(reloadedResidual?.trim()).not.toBe("");

  expect(pageErrors).toHaveLength(0);
});
