import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 mb-3" />
              <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 h-24" />
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 h-32" />
          </Card>
        </div>
      </div>
    </div>
  )
}
