'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { DashboardClock } from '@/components/dashboard-clock'
import { apiRequest } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  Wallet,
  TrendingUp,
  UtensilsCrossed,
  Calendar,
  ArrowUpRight,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

const chartConfig = {
  meals: {
    label: 'Meals',
    color: 'var(--chart-1)',
  },
  extras: {
    label: 'Extras',
    color: 'var(--chart-2)',
  },
}

interface DashboardPayload {
  success: boolean
  data: {
    student: {
      id: string
      name: string
      email: string
      hostel: string
      room: string
      semester: number
      balance: number
    }
    recentTransactions: Array<{
      id: string
      description: string
      date: string
      amount: number
      type: 'credit' | 'debit'
    }>
    weeklyConsumption: Array<{
      day: string
      meals: number
      extras: number
      total: number
    }>
    semesterSummary: {
      totalDays: number
      daysElapsed: number
    }
    todayMeals: string[]
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardPayload['data'] | null>(null)

  useEffect(() => {
    if (!user?.id) {
      return
    }

    let cancelled = false

    const loadDashboard = async () => {
      const payload = await apiRequest<DashboardPayload>(`/api/student/profile?student_id=${user.id}`, {
        cache: 'no-store',
      })

      if (!cancelled) {
        setData(payload.data)
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const profile = data?.student ?? user
  const recentTransactions = data?.recentTransactions ?? []
  const weeklyConsumption = data?.weeklyConsumption ?? []
  const semesterSummary = data?.semesterSummary
  const userBalance = profile?.balance ?? 0
  const weeklyTotal = weeklyConsumption.reduce((sum, item) => sum + item.total, 0)
  const mealsToday = data?.todayMeals.length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name.split(' ')[0] ?? 'Student'}</p>
      </div>

      <DashboardClock />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {profile?.name?.split(' ').map((namePart) => namePart[0]).join('') ?? 'ST'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{profile?.hostel}</Badge>
                <Badge variant="outline">Room {profile?.room}</Badge>
                {data?.student && <Badge variant="outline">Semester {data.student.semester}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="text-3xl font-bold text-primary">Rs. {userBalance.toLocaleString()}</span>
            <Button size="sm" className="mt-2" asChild>
              <Link href="/billing">
                <Plus className="mr-1 size-4" />
                Recharge
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {userBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Live wallet balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {weeklyTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Meals and extras combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meals Today</CardTitle>
            <UtensilsCrossed className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealsToday} / 3</div>
            <p className="text-xs text-muted-foreground">Marked so far today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Semester Progress</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semesterSummary?.daysElapsed ?? 0} / {semesterSummary?.totalDays ?? 0}</div>
            <p className="text-xs text-muted-foreground">Days elapsed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Consumption</CardTitle>
            <CardDescription>Your spending pattern this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={weeklyConsumption} accessibilityLayer>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `Rs. ${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="meals" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} name="Meals" />
                <Bar dataKey="extras" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Extras" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest mess activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/billing">
                View All
                <ArrowUpRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-foreground'}>
                        {transaction.type === 'credit' ? '+' : '-'}Rs. {transaction.amount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/menu">
              <Calendar className="mr-2 size-4" />
              View Menu
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/extras">
              <Plus className="mr-2 size-4" />
              Order Extras
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">
              <Wallet className="mr-2 size-4" />
              View Billing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
