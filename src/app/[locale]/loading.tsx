export default function Loading() {
  return (
    <div className="px-4 py-6 space-y-4 animate-pulse">
      <div className="h-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
      <div className="h-6 bg-muted rounded w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
      <div className="h-6 bg-muted rounded w-1/4 mt-4" />
      <div className="space-y-3">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    </div>
  )
}
