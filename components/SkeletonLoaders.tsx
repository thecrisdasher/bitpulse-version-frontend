import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton loader para la página de mercados
export function MarketSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-card h-screen border-r border-border overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <Skeleton className="h-8 w-48 mb-4" />
          
          <div className="space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 