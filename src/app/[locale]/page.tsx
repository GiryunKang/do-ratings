import Link from 'next/link'
import { ArrowRight, Compass, Flag, Search, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CategoryIcon } from '@/lib/icons'
import { displayRating } from '@/lib/utils/rating'
import SearchBar from '@/components/search/SearchBar'
import SubjectImage from '@/components/subject/SubjectImage'
import PlayerProgress from '@/components/game/PlayerProgress'

type Category = { id: string; slug: string; name: Record<string, string>; icon: string | null }
type Subject = { id: string; name: Record<string, string>; image_url: string | null; avg_rating: number | null; review_count: number; category_id: string; categories: Category | Category[] | null }
const order = ['restaurants', 'places', 'companies', 'airlines', 'hotels', 'people']

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const ko = locale === 'ko'
  const db = await createClient()
  const [categoryResult, subjectResult] = await Promise.all([
    db.from('categories').select('id,slug,name,icon'),
    db.from('subjects').select('id,name,image_url,avg_rating,review_count,category_id,categories(id,slug,name,icon)').order('review_count', { ascending: false }).order('id').limit(120),
  ])
  const categories = ((categoryResult.data ?? []) as Category[]).sort((a, b) => (order.indexOf(a.slug) < 0 ? 99 : order.indexOf(a.slug)) - (order.indexOf(b.slug) < 0 ? 99 : order.indexOf(b.slug)))
  const subjects = (subjectResult.data ?? []) as unknown as Subject[]
  const picks = categories.map(category => subjects.find(subject => subject.category_id === category.id)).filter((subject): subject is Subject => !!subject).slice(0, 6)
  const rated = subjects.filter(subject => subject.review_count > 0 && subject.avg_rating != null).slice(0, 4)
  const name = (value: Record<string, string>) => value[locale] || value.ko || value.en || ''
  const category = (subject: Subject) => Array.isArray(subject.categories) ? subject.categories[0] : subject.categories
  return (
    <div className="page-pad space-y-10 sm:space-y-12">
      <section className="grid items-center gap-8 xl:grid-cols-[1.4fr_1fr]" aria-labelledby="home-title">
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-secondary"><Compass size={18} aria-hidden="true" />{ko ? '작은 호기심, 새로운 발견' : 'A little curiosity. A new discovery.'}</p>
          <h1 id="home-title" className="font-display text-[30px] leading-[1.2] tracking-tight sm:text-[40px] xl:text-[42px]">{ko ? <>경험을 남기고,<br />취향을 발견하세요.</> : <>Rate your experiences.<br />Discover your taste.</>}</h1>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">{ko ? '좋아하는 식당부터 세상 곳곳까지. 내가 아는 것에서 시작해 취향의 지도를 넓혀보세요.' : 'From a favorite restaurant to the world around you. Start with something you know, and see where your curiosity takes you.'}</p>
          <SearchBar prominent />
          <p className="text-xs leading-5 text-muted-foreground">{ko ? '자유롭게 둘러보세요. 직접 경험한 것만 평가하세요.' : 'Explore freely. Let your own experience guide your rating.'}</p>
        </div>
        <PlayerProgress locale={locale} />
      </section>

      <section aria-labelledby="categories-title">
        <div className="section-heading">
          <div><p className="mb-2 text-xs font-semibold tracking-[.12em] text-secondary">EXPLORE</p><h2 id="categories-title">{ko ? '어디서 시작할까요?' : 'Where shall we begin?'}</h2></div>
          <Link className="action-link text-muted-foreground" href={`/${locale}/explore`}>{ko ? '전체 둘러보기' : 'Explore all'}<ArrowRight size={16} /></Link>
        </div>
        {categoryResult.error ? <p role="status" className="rounded-xl border border-border p-5 text-sm">{ko ? '카테고리를 불러오지 못했어요.' : 'Categories could not be loaded.'} <a href={`/${locale}`} className="underline">{ko ? '다시 시도' : 'Try again'}</a></p> :
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{categories.map(cat =>
            <Link key={cat.id} href={`/${locale}/category/${cat.slug}`} className="subject-card flex min-h-28 flex-col justify-between rounded-xl border border-border bg-card p-4">
              <CategoryIcon name={cat.icon ?? 'folder'} className="h-6 w-6 text-secondary" />
              <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold">{name(cat.name)}<ArrowRight size={14} className="shrink-0 text-muted-foreground" /></span>
            </Link>
          )}</div>}
      </section>

      <section aria-labelledby="subjects-title">
        <div className="section-heading"><div><h2 id="subjects-title">{ko ? '익숙한 것들, 새로운 발견' : 'Familiar favorites. New discoveries.'}</h2><p className="mt-2 text-sm text-muted-foreground">{ko ? '여섯 분야에서 시작점을 골라보세요.' : 'A starting point from each of our six categories.'}</p></div><Link className="action-link action-secondary" href={`/${locale}/play`}><Compass size={16} />{ko ? '뜻밖의 탐험' : 'Surprise me'}</Link></div>
        {subjectResult.error ? <p role="status" className="rounded-xl border border-border p-5 text-sm">{ko ? '대상을 불러오지 못했어요.' : 'Topics could not be loaded.'} <a href={`/${locale}`} className="underline">{ko ? '다시 시도' : 'Try again'}</a></p> : picks.length === 0 ? <p className="text-sm text-muted-foreground">{ko ? '아직 등록된 대상이 없습니다.' : 'There are no topics yet.'}</p> :
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">{picks.map((subject, index) =>
            <Link key={subject.id} href={`/${locale}/subject/${subject.id}`} className="subject-card overflow-hidden rounded-xl border border-border bg-card">
              <SubjectImage src={subject.image_url} name={name(subject.name)} className="aspect-[16/10]" sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 300px" priority={index < 2} />
              <div className="space-y-2 p-3 sm:p-4">
                <p className="text-xs text-secondary">{category(subject) ? name(category(subject)!.name) : ''}</p>
                <h3 className="min-h-10 text-sm font-semibold leading-5 line-clamp-2 sm:text-base">{name(subject.name)}</h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">{subject.review_count > 0 && subject.avg_rating != null ? <><span className="flex items-center gap-1 font-semibold text-foreground"><Star size={13} className="text-primary" aria-hidden="true" />{displayRating(subject.avg_rating)}<span className="font-normal text-muted-foreground">/10</span></span><span>{ko ? `리뷰 ${subject.review_count}개` : `${subject.review_count} reviews`}</span></> : <span>{ko ? '첫 평가를 기다려요' : 'Be the first to rate'}</span>}</div>
              </div>
            </Link>
          )}</div>}
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="rated-title">
          <div className="section-heading"><h2 id="rated-title">{ko ? '다른 사람들은 어떻게 봤을까요' : 'What do others think?'}</h2></div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">{rated.length ? rated.map(subject => <Link key={subject.id} href={`/${locale}/subject/${subject.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50"><SubjectImage src={subject.image_url} name={name(subject.name)} className="h-12 w-12 shrink-0 rounded-lg" sizes="48px" /><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{name(subject.name)}</h3><p className="mt-1 text-xs text-muted-foreground">{ko ? `리뷰 ${subject.review_count}개` : `${subject.review_count} reviews`}</p></div><span className="shrink-0 text-sm font-bold">{displayRating(subject.avg_rating!)}<span className="ml-1 text-xs font-normal text-muted-foreground">/10</span></span></Link>) : <p className="p-5 text-sm text-muted-foreground">{ko ? '평가가 쌓이면 여기에 나타나요.' : 'Rated topics will appear here as the community grows.'}</p>}</div>
          <Link className="action-link mt-2 text-secondary" href={`/${locale}/rankings`}>{ko ? '랭킹 둘러보기' : 'Browse rankings'}<ArrowRight size={16} /></Link>
        </section>
        <section className="flex flex-col items-start justify-center rounded-2xl border border-secondary/20 bg-secondary/5 p-6 sm:p-8">
          <Flag className="mb-5 h-7 w-7 text-secondary" aria-hidden="true" />
          <h2 className="font-display text-2xl leading-snug">{ko ? '한 분야씩, 나만의 취향 지도.' : 'One category at a time. Your own taste map.'}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{ko ? '새 분야를 평가하면 도장이 채워져요. 새로운 대상을 만나고 발견의 기록을 쌓아보세요.' : 'Collect a stamp when you review a new category. Meet new topics and build a record of your discoveries.'}</p>
          <Link className="action-link action-primary mt-6" href={`/${locale}/play`}>{ko ? '탐험 시작하기' : 'Start exploring'}<ArrowRight size={16} /></Link>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{ko ? '저장된 평가만 진척에 반영됩니다.' : 'Only saved reviews count toward your progress.'}</p>
        </section>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground"><Search size={18} aria-hidden="true" /><p className="flex-1">{ko ? '빠진 대상이 있나요? 직접 찾아볼 수 있어요.' : 'Missing a topic? You can suggest one.'}</p><Link href={`/${locale}/explore`} className="action-link action-secondary">{ko ? '대상 찾아보기' : 'Find a topic'}<ArrowRight size={16} /></Link></div>
    </div>
  )
}
