// Convert 2-letter country code to flag emoji
export function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const code = countryCode.toUpperCase()
  const offset = 127397 // Regional Indicator Symbol offset
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  )
}

// Common country names for tooltip
const countryNames: Record<string, { ko: string; en: string }> = {
  KR: { ko: '대한민국', en: 'South Korea' },
  US: { ko: '미국', en: 'United States' },
  JP: { ko: '일본', en: 'Japan' },
  CN: { ko: '중국', en: 'China' },
  GB: { ko: '영국', en: 'United Kingdom' },
  DE: { ko: '독일', en: 'Germany' },
  FR: { ko: '프랑스', en: 'France' },
  AU: { ko: '호주', en: 'Australia' },
  CA: { ko: '캐나다', en: 'Canada' },
  IN: { ko: '인도', en: 'India' },
  BR: { ko: '브라질', en: 'Brazil' },
  TW: { ko: '대만', en: 'Taiwan' },
  TH: { ko: '태국', en: 'Thailand' },
  VN: { ko: '베트남', en: 'Vietnam' },
  SG: { ko: '싱가포르', en: 'Singapore' },
  MY: { ko: '말레이시아', en: 'Malaysia' },
  PH: { ko: '필리핀', en: 'Philippines' },
  ID: { ko: '인도네시아', en: 'Indonesia' },
  IT: { ko: '이탈리아', en: 'Italy' },
  ES: { ko: '스페인', en: 'Spain' },
  MX: { ko: '멕시코', en: 'Mexico' },
  RU: { ko: '러시아', en: 'Russia' },
  AE: { ko: 'UAE', en: 'UAE' },
  SA: { ko: '사우디아라비아', en: 'Saudi Arabia' },
  TR: { ko: '터키', en: 'Turkey' },
  NZ: { ko: '뉴질랜드', en: 'New Zealand' },
}

export function getCountryName(code: string, locale: string): string {
  const entry = countryNames[code.toUpperCase()]
  if (entry) return locale === 'ko' ? entry.ko : entry.en
  return code.toUpperCase()
}
