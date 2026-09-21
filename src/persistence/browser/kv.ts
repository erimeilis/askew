import { createStore, get, set, del } from "idb-keyval";
import { STORAGE_CONFIG } from "@/config/storage";

const store = createStore(STORAGE_CONFIG.db.name, STORAGE_CONFIG.db.store);

/** The only module that talks to IndexedDB (via idb-keyval), never localStorage. */
export const kv = {
  get: (key: string) => get<string>(key, store),
  set: (key: string, value: string) => set(key, value, store),
  del: (key: string) => del(key, store),
};
