export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

export function validateReviewInput(title: string, content: string): string | null {
  if (title.length === 0) return 'Title is required'
  if (title.length > 100) return 'Title must be 100 characters or less'
  if (content.length === 0) return 'Content is required'
  if (content.length > 5000) return 'Content must be 5000 characters or less'
  return null
}
