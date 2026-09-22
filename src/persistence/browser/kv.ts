import { createStore, get, set, del } from "idb-keyval";
import { STORAGE_CONFIG } from "@/config/storage";

const store = createStore(STORAGE_CONFIG.db.name, STORAGE_CONFIG.db.store);

/**
 * The only module that talks to IndexedDB (via idb-keyval), never localStorage.
 * `get`/`set` default to `string` (the shape every plan/autosave value takes) but accept an
 * explicit type argument for other structured-cloneable values, such as a persisted
 * `FileSystemFileHandle`.
 */
export const kv = {
  get: <T = string>(key: string) => get<T>(key, store),
  set: (key: string, value: unknown) => set(key, value, store),
  del: (key: string) => del(key, store),
};
