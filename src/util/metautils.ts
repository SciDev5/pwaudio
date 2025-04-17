export function is_client(): boolean {
    return "window" in globalThis
}