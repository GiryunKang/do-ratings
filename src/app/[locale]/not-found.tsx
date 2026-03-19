import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <span className="text-4xl">🔍</span>
      </div>
      <h2 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-muted-foreground mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link href="/" className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center hover:bg-primary/80">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
