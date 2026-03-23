import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About — Do! Ratings!' }

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const ko = locale === 'ko'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          {ko ? '세상 모든 것에' : 'Honest Ratings for'}{' '}
          <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            {ko ? '솔직한 평가를' : 'Everything'}
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {ko
            ? 'Do! Ratings!는 누구나, 어떤 것이든, 솔직하게 평가할 수 있는 글로벌 리뷰 플랫폼입니다. 당신의 한 줄이 세상을 바꿉니다.'
            : 'Do! Ratings! is a global review platform where anyone can honestly rate anything. Your voice shapes the world.'}
        </p>
      </section>

      {/* Philosophy */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-xl">💡</span>
          {ko ? '우리의 철학' : 'Our Philosophy'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-2xl">⭐</div>
            <h3 className="font-bold text-lg">{ko ? '솔직한 평가' : 'Honest Ratings'}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ko
                ? '좋은 것은 좋다, 나쁜 것은 나쁘다. 꾸밈없는 솔직한 평가가 더 나은 세상을 만듭니다.'
                : 'Good is good, bad is bad. Honest, unfiltered ratings make the world better.'}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center text-2xl">🌍</div>
            <h3 className="font-bold text-lg">{ko ? '모든 것을 평가' : 'Rate Everything'}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ko
                ? '인물, 기업, 장소, 항공사, 호텔, 맛집까지. 세상에 평가 못 할 것은 없습니다. 당신의 경험을 나눠주세요.'
                : 'People, companies, places, airlines, hotels, restaurants. Nothing is off-limits. Share your experience.'}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center text-2xl">🗳️</div>
            <h3 className="font-bold text-lg">{ko ? '누구나 참여하는 평가' : 'Ratings by Everyone'}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ko
                ? '한 사람의 평가가 모여 세상을 바꿉니다. 모든 사람의 목소리에는 동등한 가치가 있습니다.'
                : 'Individual ratings combine to change the world. Every voice has equal value.'}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-xl">🚀</span>
          {ko ? '주요 기능' : 'Key Features'}
        </h2>
        <div className="space-y-4">
          {[
            {
              icon: '⭐',
              title: ko ? '별점 평가' : 'Star Ratings',
              desc: ko ? '1~5점까지 별점으로 간편하게 평가하세요. 한 번의 탭으로 당신의 의견을 남길 수 있습니다.' : 'Rate from 1 to 5 stars with a single tap. Express your opinion instantly.',
            },
            {
              icon: '📊',
              title: ko ? '트렌드 분석' : 'Trend Analysis',
              desc: ko ? '시간에 따른 평점 변화를 차트로 확인하세요. 주간, 월간, 분기별 트렌드를 한눈에 볼 수 있습니다.' : 'Track rating changes over time with charts. See weekly, monthly, and quarterly trends at a glance.',
            },
            {
              icon: '🤖',
              title: ko ? 'AI 리뷰 요약' : 'AI Review Summary',
              desc: ko ? 'AI가 모든 리뷰를 분석하여 장점, 단점, 전체 감성을 한눈에 보여줍니다.' : 'AI analyzes all reviews to show pros, cons, and overall sentiment at a glance.',
            },
            {
              icon: '🔍',
              title: ko ? '검색 & 비교' : 'Search & Compare',
              desc: ko ? '원하는 대상을 검색하고, 최대 3개까지 나란히 비교할 수 있습니다. Google Places 연동으로 맛집과 장소도 바로 찾을 수 있습니다.' : 'Search for any subject and compare up to 3 side by side. Find restaurants and places through Google Places integration.',
            },
            {
              icon: '💬',
              title: ko ? '댓글 & 리액션' : 'Comments & Reactions',
              desc: ko ? '리뷰에 댓글을 달고, 이모지로 반응하세요. 도움이 됐다면 👍, 아니라면 👎로 알려주세요.' : 'Comment on reviews, react with emojis. Let others know if a review was helpful with 👍 or 👎.',
            },
            {
              icon: '📚',
              title: ko ? '컬렉션' : 'Collections',
              desc: ko ? '"서울 맛집 베스트", "출장용 호텔 TOP" 같은 나만의 큐레이션 리스트를 만들어 공유하세요.' : 'Create curated lists like "Best Seoul Restaurants" or "Top Business Hotels" and share them.',
            },
            {
              icon: '⚔️',
              title: ko ? '리뷰 배틀' : 'Review Battles',
              desc: ko ? '같은 대상에 대한 두 리뷰를 대결시키고, 어떤 의견이 더 설득력 있는지 투표하세요.' : 'Put two reviews head-to-head and vote on which opinion is more convincing.',
            },
            {
              icon: '🏆',
              title: ko ? '업적 & 뱃지' : 'Achievements & Badges',
              desc: ko ? '리뷰를 작성할수록 업적을 획득하고 레벨이 올라갑니다. Bronze → Silver → Gold → Platinum으로 성장하세요.' : 'Earn achievements and level up as you write reviews. Grow from Bronze → Silver → Gold → Platinum.',
            },
            {
              icon: '🌏',
              title: ko ? '글로벌 리뷰' : 'Global Reviews',
              desc: ko ? '전 세계 어디서든 평가할 수 있고, 리뷰어의 국가가 자동으로 표시됩니다. 다양한 관점의 리뷰를 만나보세요.' : 'Rate from anywhere in the world. Reviewer countries are shown automatically. Discover diverse perspectives.',
            },
            {
              icon: '🔒',
              title: ko ? '안전한 플랫폼' : 'Safe Platform',
              desc: ko ? '비방, 욕설, 허위 사실은 자동 필터링됩니다. 신고 시스템과 관리자 검토로 건강한 리뷰 문화를 지킵니다.' : 'Slander, profanity, and false claims are auto-filtered. A reporting system and admin review maintain a healthy review culture.',
            },
          ].map((feature, i) => (
            <div key={i} className="flex gap-4 items-start bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-xl shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-xl">📂</span>
          {ko ? '평가 카테고리' : 'Rating Categories'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '👤', name: ko ? '인물' : 'People', desc: ko ? '정치인, CEO, 공인' : 'Politicians, CEOs, Public Figures' },
            { icon: '📍', name: ko ? '장소' : 'Places', desc: ko ? '랜드마크, 관광지' : 'Landmarks, Tourist Spots' },
            { icon: '🏢', name: ko ? '기업' : 'Companies', desc: ko ? '글로벌 브랜드, 테크' : 'Global Brands, Tech' },
            { icon: '🍽️', name: ko ? '맛집' : 'Restaurants', desc: ko ? '로컬 맛집, 프랜차이즈' : 'Local Eateries, Chains' },
            { icon: '✈️', name: ko ? '항공사' : 'Airlines', desc: ko ? '전 세계 43개 항공사' : '43 Airlines Worldwide' },
            { icon: '🏨', name: ko ? '호텔' : 'Hotels', desc: ko ? '글로벌 호텔 체인' : 'Global Hotel Chains' },
          ].map((cat, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 text-center space-y-2 hover:shadow-md transition-shadow">
              <div className="text-3xl">{cat.icon}</div>
              <h3 className="font-bold">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-xl">📖</span>
          {ko ? '이용 방법' : 'How It Works'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', icon: '🔍', title: ko ? '대상 찾기' : 'Find', desc: ko ? '검색하거나 카테고리에서 평가할 대상을 찾으세요' : 'Search or browse categories to find what to rate' },
            { step: '2', icon: '⭐', title: ko ? '별점 주기' : 'Rate', desc: ko ? '1~5점 별점을 탭하고, 솔직한 리뷰를 작성하세요' : 'Tap 1-5 stars and write an honest review' },
            { step: '3', icon: '💬', title: ko ? '소통하기' : 'Engage', desc: ko ? '다른 리뷰에 댓글, 좋아요, 리액션으로 참여하세요' : 'Comment, like, and react to other reviews' },
            { step: '4', icon: '🌟', title: ko ? '성장하기' : 'Grow', desc: ko ? '리뷰를 쌓아 업적을 획득하고 레벨업하세요' : 'Earn achievements and level up by reviewing' },
          ].map((item, i) => (
            <div key={i} className="text-center space-y-3 p-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto">{item.step}</div>
              <div className="text-2xl">{item.icon}</div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-bold">
          {ko ? '지금 바로 참여하세요' : 'Join Us Now'}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {ko
            ? '당신의 솔직한 평가 한 줄이 누군가의 선택을 돕고, 세상을 더 투명하게 만듭니다.'
            : 'Your honest rating helps someone make a better choice and makes the world more transparent.'}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/80 transition-all hover:scale-105 text-sm">
            ⚡ {ko ? '평가하러 가기' : 'Start Rating'}
          </Link>
          <Link href={`/${locale}/auth/signup`}
            className="inline-flex items-center gap-2 px-6 py-3 border border-border font-bold rounded-full hover:bg-muted transition-all text-sm">
            {ko ? '회원가입' : 'Sign Up'}
          </Link>
        </div>
      </section>

    </div>
  )
}
