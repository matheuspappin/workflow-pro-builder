import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="h-16 border-b border-white/10 bg-black flex items-center px-6">
        <Skeleton className="h-6 w-48 bg-white/10" />
      </header>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-5 w-1/3 bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-5 w-1/3 bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
            </CardHeader>
            <CardContent className="h-[300px] space-y-4 pt-4">
              <Skeleton className="h-8 w-full bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
