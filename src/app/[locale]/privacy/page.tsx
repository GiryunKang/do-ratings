import type { Metadata } from 'next'

export const metadata: Metadata = { title: '개인정보처리방침 — Do! Ratings!' }

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const ko = locale === 'ko'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{ko ? '개인정보처리방침' : 'Privacy Policy'}</h1>
      <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
        <p className="text-xs">{ko ? '최종 업데이트: 2026년 3월 20일' : 'Last updated: March 20, 2026'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '1. 수집하는 개인정보' : '1. Information We Collect'}</h2>
        <p>{ko ? 'Do! Ratings!는 다음과 같은 개인정보를 수집합니다:' : 'Do! Ratings! collects the following personal information:'}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{ko ? '이메일 주소 (회원가입 시)' : 'Email address (upon registration)'}</li>
          <li>{ko ? '닉네임, 프로필 이미지 (사용자 설정)' : 'Nickname, profile image (user settings)'}</li>
          <li>{ko ? '리뷰, 평점, 댓글 등 사용자 작성 콘텐츠' : 'User-generated content: reviews, ratings, comments'}</li>
          <li>{ko ? 'IP 주소 및 접속 국가 (서비스 개선 및 보안)' : 'IP address and country (for service improvement and security)'}</li>
          <li>{ko ? '소셜 로그인 정보 (Google, Kakao, Apple 프로필)' : 'Social login information (Google, Kakao, Apple profiles)'}</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '2. 개인정보 이용 목적' : '2. How We Use Your Information'}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{ko ? '서비스 제공 및 운영' : 'Providing and operating the Service'}</li>
          <li>{ko ? '사용자 인증 및 계정 관리' : 'User authentication and account management'}</li>
          <li>{ko ? '리뷰 및 평점 표시' : 'Displaying reviews and ratings'}</li>
          <li>{ko ? '서비스 개선을 위한 통계 분석' : 'Statistical analysis for service improvement'}</li>
          <li>{ko ? '부정 이용 방지 및 보안' : 'Fraud prevention and security'}</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '3. 제3자 서비스' : '3. Third-Party Services'}</h2>
        <p>{ko ? '본 서비스는 다음과 같은 제3자 서비스를 이용합니다:' : 'This Service uses the following third-party services:'}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{ko ? 'Supabase — 데이터베이스 및 인증' : 'Supabase — Database and authentication'}</li>
          <li>{ko ? 'Vercel — 호스팅 및 서버 인프라' : 'Vercel — Hosting and server infrastructure'}</li>
          <li>{ko ? 'Google Places API — 장소 검색 및 이미지' : 'Google Places API — Place search and images'}</li>
          <li>{ko ? 'Wikipedia API — 이미지 및 정보' : 'Wikipedia API — Images and information'}</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '4. 쿠키' : '4. Cookies'}</h2>
        <p>{ko ? '서비스는 인증 세션 관리를 위해 필수 쿠키를 사용합니다. 광고 목적의 추적 쿠키는 사용하지 않습니다.' : 'The Service uses essential cookies for authentication session management. We do not use tracking cookies for advertising purposes.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '5. 데이터 보관' : '5. Data Retention'}</h2>
        <p>{ko ? '개인정보는 서비스 이용 기간 동안 보관되며, 계정 삭제 시 즉시 파기됩니다. 법령에 의해 보관이 필요한 경우 해당 기간 동안 보관합니다.' : 'Personal data is retained during the period of service use and is immediately deleted upon account deletion. Data may be retained longer if required by law.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '6. 사용자 권리' : '6. Your Rights'}</h2>
        <p>{ko ? '사용자는 다음과 같은 권리를 가집니다:' : 'You have the following rights:'}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{ko ? '개인정보 열람, 수정, 삭제 요청' : 'Access, modify, and delete your personal data'}</li>
          <li>{ko ? '계정 삭제를 통한 모든 데이터 영구 삭제' : 'Permanently delete all data by deleting your account'}</li>
          <li>{ko ? '개인정보 처리에 대한 동의 철회' : 'Withdraw consent for data processing'}</li>
        </ul>
        <p>{ko ? '설정 페이지에서 계정 삭제를 통해 모든 개인정보를 즉시 삭제할 수 있습니다.' : 'You can immediately delete all personal data by deleting your account in the Settings page.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '7. 보안' : '7. Security'}</h2>
        <p>{ko ? '개인정보는 암호화된 연결(HTTPS)을 통해 전송되며, Supabase의 행 수준 보안(RLS) 정책에 의해 보호됩니다.' : 'Personal data is transmitted via encrypted connections (HTTPS) and protected by Supabase Row Level Security (RLS) policies.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '8. 문의' : '8. Contact'}</h2>
        <p>{ko ? '개인정보 처리에 관한 문의는 서비스 내 고객지원을 통해 해주시기 바랍니다.' : 'For inquiries regarding data processing, please contact us through the in-service support channel.'}</p>
      </div>
    </div>
  )
}
