import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecentActivities() {
  const activities = [
    {
      title: "DeFi Fundamentals Quiz #3",
      description: "9/10 correct",
      time: "2 hours ago",
      reward: "+1.80 CELO",
      icon: "✓",
      color: "text-green-500",
    },
    {
      title: "Smart Contract Analysis Challenge",
      description: "Entry submitted",
      time: "5 hours ago",
      reward: "Pending results",
      icon: "🏆",
      color: "text-blue-500",
    },
    {
      title: "Enrolled in CELO Ecosystem Deep Dive",
      description: "Course started",
      time: "1 day ago",
      reward: "-25.0 CELO",
      icon: "📚",
      color: "text-orange-500",
    },
    {
      title: "Blockchain Basics Quiz #5",
      description: "7/10 correct",
      time: "3 days ago",
      reward: "+1.40 CELO",
      icon: "✓",
      color: "text-green-500",
    },
  ]

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
              <div className={`text-2xl ${activity.color}`}>{activity.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{activity.reward}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
