import type { Metadata } from 'next'

export const metadata: Metadata = { title: '이용약관 — Do! Ratings!' }

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const ko = locale === 'ko'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{ko ? '이용약관' : 'Terms of Service'}</h1>
      <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
        <p className="text-xs text-muted-foreground">{ko ? '최종 업데이트: 2026년 3월 20일' : 'Last updated: March 20, 2026'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '1. 서비스 소개' : '1. About the Service'}</h2>
        <p>{ko ? 'Do! Ratings!(이하 "서비스")는 인물, 기업, 장소, 항공사, 호텔, 레스토랑 등 다양한 대상에 대해 사용자가 평점과 리뷰를 남길 수 있는 글로벌 리뷰 플랫폼입니다.' : 'Do! Ratings! ("Service") is a global review platform where users can rate and review various subjects including people, companies, places, airlines, hotels, and restaurants.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '2. 이용 자격' : '2. Eligibility'}</h2>
        <p>{ko ? '본 서비스를 이용하기 위해서는 만 14세 이상이어야 합니다. 회원가입 시 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.' : 'You must be at least 14 years old to use this Service. You must provide accurate information during registration and must not impersonate others.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '3. 사용자 콘텐츠' : '3. User Content'}</h2>
        <p>{ko ? '사용자가 작성한 리뷰, 평점, 댓글 등의 콘텐츠에 대한 저작권은 해당 사용자에게 있습니다. 다만, 서비스 운영을 위해 해당 콘텐츠를 서비스 내에서 표시, 배포할 수 있는 비독점적 라이선스를 부여합니다.' : 'You retain copyright over your reviews, ratings, and comments. However, you grant Do! Ratings! a non-exclusive license to display and distribute such content within the Service.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '4. 금지 행위' : '4. Prohibited Activities'}</h2>
        <p>{ko ? '다음 행위는 금지됩니다:' : 'The following activities are prohibited:'}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{ko ? '허위 또는 악의적인 리뷰 작성' : 'Writing false or malicious reviews'}</li>
          <li>{ko ? '스팸, 광고성 콘텐츠 게시' : 'Posting spam or promotional content'}</li>
          <li>{ko ? '혐오 발언, 차별적 표현, 개인 공격' : 'Hate speech, discriminatory language, personal attacks'}</li>
          <li>{ko ? '타인의 개인정보 무단 게시' : 'Unauthorized disclosure of personal information'}</li>
          <li>{ko ? '서비스의 기술적 보안 조치 우회' : 'Circumventing technical security measures'}</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '5. 인물 평가 정책' : '5. People Rating Policy'}</h2>
        <p>{ko ? '인물 카테고리의 평가 대상은 정치인, 기업인, 국가원수 등 공적 활동을 하는 인물로 제한됩니다.' : 'Subjects in the People category are limited to public figures engaged in public activities, such as politicians, business leaders, and heads of state.'}</p>
        <p className="font-medium">{ko ? '한국 연예인(가수, 배우, 방송인, 스포츠 선수 등)에 대한 평가는 관련 법률(정보통신망법, 명예훼손법 등)에 따라 엄격히 제한되며, 해당 대상의 등록 및 리뷰 작성이 금지됩니다.' : 'Rating Korean celebrities (singers, actors, broadcasters, athletes, etc.) is strictly restricted under applicable laws (Information and Communications Network Act, defamation laws, etc.). Registration of such subjects and writing reviews about them is prohibited.'}</p>
        <p>{ko ? '해외 연예인 및 공인에 대한 평가는 허용되나, 해당 국가의 법률과 본 서비스의 이용약관을 준수해야 합니다.' : 'Ratings of international celebrities and public figures are permitted, subject to compliance with applicable local laws and these Terms of Service.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '6. 계정 관리' : '6. Account Management'}</h2>
        <p>{ko ? '사용자는 자신의 계정 보안에 대한 책임이 있습니다. 비밀번호를 안전하게 관리하고, 무단 접근이 의심되는 경우 즉시 알려주시기 바랍니다. 사용자는 언제든지 계정을 삭제할 수 있으며, 삭제 시 모든 데이터가 영구적으로 제거됩니다.' : 'You are responsible for maintaining the security of your account. Keep your password safe and notify us immediately if you suspect unauthorized access. You may delete your account at any time, which will permanently remove all associated data.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '7. 서비스 중단 및 변경' : '7. Service Modification'}</h2>
        <p>{ko ? '운영자는 사전 통지 없이 서비스를 수정, 중단, 종료할 수 있습니다. 중요한 변경 사항은 서비스 내 공지를 통해 안내합니다.' : 'We may modify, suspend, or discontinue the Service without prior notice. Significant changes will be communicated through in-service announcements.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '8. 면책 조항' : '8. Disclaimer'}</h2>
        <p>{ko ? '서비스는 "있는 그대로" 제공되며, 사용자 리뷰의 정확성, 완전성, 신뢰성에 대해 보증하지 않습니다. 리뷰는 개인의 의견이며, Do! Ratings!의 공식 입장이 아닙니다.' : 'The Service is provided "as is." We do not guarantee the accuracy, completeness, or reliability of user reviews. Reviews represent individual opinions and do not reflect the official position of Do! Ratings!.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '9. 지적 재산권' : '9. Intellectual Property'}</h2>
        <p>{ko ? 'Do! Ratings!의 로고, 디자인, 소프트웨어 및 기타 지적 재산은 운영자에게 귀속됩니다. 사전 서면 동의 없이 복제, 수정, 배포할 수 없습니다.' : 'The Do! Ratings! logo, design, software, and other intellectual property belong to the operator. Reproduction, modification, or distribution without prior written consent is prohibited.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '10. 준거법' : '10. Governing Law'}</h2>
        <p>{ko ? '본 약관은 대한민국 법률에 따라 해석되고 적용됩니다. 서비스 이용과 관련한 분쟁은 서울중앙지방법원을 관할 법원으로 합니다.' : 'These terms are governed by the laws of the Republic of Korea. Disputes related to the use of the Service shall be subject to the jurisdiction of the Seoul Central District Court.'}</p>

        <h2 className="text-base font-semibold text-foreground pt-2">{ko ? '11. 문의' : '11. Contact'}</h2>
        <p>{ko ? '본 약관에 대한 문의는 서비스 내 고객지원을 통해 해주시기 바랍니다.' : 'For inquiries about these terms, please contact us through the in-service support channel.'}</p>
      </div>
    </div>
  )
}
