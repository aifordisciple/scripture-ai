// Recursive type that maps literal string types to `string` while preserving the key structure.
// This allows dictionaries to use `as const` (for autocomplete of key paths) while
// providing type safety for all locale values.
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type { DeepStringify }
