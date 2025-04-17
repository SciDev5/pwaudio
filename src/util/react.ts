import { useMemo } from "react";

export function usePassthroughMemo<T extends Record<string, unknown>>(data: T): T {
    const ref = useMemo<T>(() => ({} as T), [])
    for (const k in data) {
        ref[k] = data[k]
    }
    return ref
}