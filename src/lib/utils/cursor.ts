export function encodeCursor(createdAt: string, id: string): string {
  return btoa(JSON.stringify({ createdAt, id }))
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor))
  } catch {
    return null
  }
}
