import { ArrowUpRight, Clock, Users, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

const stats = [
  { label: 'Active users', value: '2,418', icon: Users },
  { label: 'Open work', value: '184', icon: Clock },
  { label: 'Revenue', value: '$48.2k', icon: WalletCards },
]

const work = [
  'Review flagged signups',
  'Ship onboarding email variant',
  'Audit upload usage',
]

export function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Operational snapshot</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                </div>
                <Icon size={20} className="text-muted-foreground" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Next actions</h2>
              <p className="text-xs text-muted-foreground">Queued for review</p>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {work.map((item) => (
            <div key={item} className="rounded border bg-background px-3 py-2 text-sm">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
