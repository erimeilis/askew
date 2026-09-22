/**
 * Minimal ambient types for the File System Access API (`showSaveFilePicker` /
 * `showOpenFilePicker`), which this project's bundled TypeScript DOM lib does not yet
 * declare. Only the members `files.ts` actually calls are declared. No import/export here on
 * purpose: that keeps this a global ambient script, so these merge straight into the global
 * scope without an `export {}` + `declare global` wrapper.
 */

interface FileSystemFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}
interface FileSystemWritableFileStream {
  write(data: BlobPart | string): Promise<void>;
  close(): Promise<void>;
}
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}
interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
}
interface Window {
  showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  showOpenFilePicker?(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
}
