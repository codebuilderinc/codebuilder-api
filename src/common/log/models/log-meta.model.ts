// Note: We're deliberately not allowing arrays to be logged because they don't index well.
// Instead, log the length of the array and/or turn it into a controlled-length string via
// `JSON.stringify(value.slice(0, 100))`
export type LogMetaData =
  | string
  | number
  | boolean
  | bigint
  | Date
  | { [key: string]: LogMetaData };

export type LogMeta = Record<string, LogMetaData>;
