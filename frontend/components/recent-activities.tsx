import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecentActivities() {
  const [activities, setActivities] = useState<any[]>([])
  const { address } = useAccount()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const url = address ? `/api/activities?address=${address}` : `/api/activities`
        const res = await fetch(url)
        const json = await res.json()
        if (res.ok && mounted) {
          setActivities(json.data || [])
        }
      } catch (e) {
        console.warn("Failed to load activities", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Your latest learning activities and rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="text-2xl text-primary">{activity.type === "quiz" ? "✏️" : activity.type === "bounty" ? "🏆" : "📄"}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(activity.time).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{activity.reward || ""}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
