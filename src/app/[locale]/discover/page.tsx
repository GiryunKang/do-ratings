import { createClient } from '@/lib/supabase/server'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import dynamic from 'next/dynamic'

const SubjectShuffle = dynamic(() => import('@/components/home/SubjectShuffle'))
const RatingRoulette = dynamic(() => import('@/components/home/RatingRoulette'))
const QuickFaceoff = dynamic(() => import('@/components/home/QuickFaceoff'))
const MysterySubject = dynamic(() => import('@/components/home/MysterySubject'))

interface LocalizedText {
  [key: string]: string
}

interface SubjectCategoryRecord {
  slug: string
  name: LocalizedText
  icon: string | null
}

interface SubjectRecord {
  id: string
  name: LocalizedText
  avg_rating: number | null
  review_count: number
  description: LocalizedText | null
  category_id: string
  image_url: string | null
  categories: SubjectCategoryRecord | SubjectCategoryRecord[] | null
}

function pickRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export default async function DiscoverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  // TODO: Extract shared subjects query to lib/data/subjects.ts with caching
  const { data: allSubjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)')
    .limit(200)

  if (subjectsError) {
    console.error('[DiscoverPage] Supabase query error:', subjectsError.message)
  }

  const subjects = (allSubjects ?? []) as SubjectRecord[]

  const mappedSubjects = subjects.map((subject) => {
    const category = pickRelation(subject.categories)

    return {
      id: subject.id,
      name: subject.name,
      avg_rating: subject.avg_rating,
      review_count: subject.review_count,
      image_url: proxyImageUrl(subject.image_url),
      category_slug: category?.slug ?? '',
      category_name: category?.name ?? {},
      category_icon: category?.icon ?? 'folder',
    }
  })

  return (
    <div className="pb-16">
      {/* Page header */}
      <section className="px-4 pt-8">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">Discover</p>
        <h1 className="font-display text-3xl text-foreground mb-2">
          {locale === 'ko' ? '새로운 발견' : 'Discover Something New'}
        </h1>
        <p className="text-base text-muted-foreground max-w-[65ch]">
          {locale === 'ko'
            ? '무작위 추천, 대결, 미스터리까지 — 새로운 관점을 만나보세요.'
            : 'Random picks, face-offs, and mysteries — find your next perspective.'}
        </p>
      </section>

      {/* Mystery Subject - full width */}
      <section className="px-4 mt-16">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {"Today's Mystery"}
        </p>
        <MysterySubject locale={locale} subjects={mappedSubjects} />
      </section>

      {/* Subject Shuffle */}
      <section className="px-4 mt-16">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">Shuffle</p>
        <h2 className="font-display text-2xl text-foreground mb-6">
          {locale === 'ko' ? '랜덤 추천' : 'Random Picks'}
        </h2>
        <SubjectShuffle subjects={mappedSubjects} locale={locale} />
      </section>

      {/* Two column grid: Roulette + Faceoff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 mt-16">
        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">Roulette</p>
          <h2 className="font-display text-2xl text-foreground mb-6">
            {locale === 'ko' ? '룰렛' : 'Spin the Wheel'}
          </h2>
          <RatingRoulette subjects={mappedSubjects} locale={locale} />
        </section>
        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">Face-off</p>
          <h2 className="font-display text-2xl text-foreground mb-6">
            {locale === 'ko' ? '대결' : 'Head to Head'}
          </h2>
          <QuickFaceoff subjects={mappedSubjects} locale={locale} />
        </section>
      </div>
    </div>
  )
}
