// Basic profanity/hate speech filter
// This list covers common Korean and English slurs/hate speech
// In production, use a more comprehensive library or API

const BLOCKED_PATTERNS = [
  // Korean profanity
  /시[바발벌]/, /씨[바발벌]/, /ㅅㅂ/, /ㅂㅅ/, /지[랄]/, /ㅈㄹ/,
  /병[신]/, /ㅂㅅ/, /미친[놈년]/, /꺼[져저]/, /닥[쳐처]/,
  /죽[어을일]/, /찢[어]/, /패[버]/, /살[해]해/,
  // English profanity
  /\bf+u+c+k/i, /\bsh+i+t/i, /\bass+h/i, /\bb+i+t+c+h/i,
  /\bd+a+m+n/i, /\bdie\b/i, /\bkill\b/i,
  // Hate speech patterns
  /[장애]인.*비하/, /인종.*차별/, /혐오/,
]

export function containsProfanity(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text))
}

export function getProfanityWarning(locale: string): string {
  return locale === 'ko'
    ? '비방, 욕설, 혐오 표현이 포함되어 있어 게시할 수 없습니다.'
    : 'Your review contains prohibited language and cannot be posted.'
}
