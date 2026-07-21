'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Plus,
  Calendar,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

const chartConfig = {
  total: {
    label: 'Daily Spending',
    color: 'var(--chart-1)',
  },
}

interface BillingPayload {
  success: boolean
  data: {
    student: {
      balance: number
    }
    balance: {
      remaining_balance: number
    }
    transactions: Array<{
      id: string
      date: string
      description: string
      amount: number
      type: 'debit' | 'credit'
      category: 'meal' | 'extra' | 'recharge' | 'refund'
    }>
    weeklyConsumption: Array<{
      day: string
      total: number
    }>
    semesterSummary: {
      totalSpent: number
      averageDaily: number
      extraSpent: number
      daysElapsed: number
      totalDays: number
      totalMeals: number
      mealsConsumed: number
    }
  }
}

export default function BillingPage() {
  const { user, refreshUser } = useAuth()
  const [filter, setFilter] = useState<string>('all')
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [data, setData] = useState<BillingPayload['data'] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadBilling = async () => {
    if (!user?.id) {
      return
    }

    const payload = await apiRequest<BillingPayload>(`/api/student/profile?student_id=${user.id}`, {
      cache: 'no-store',
    })

    setData(payload.data)
  }

  useEffect(() => {
    void loadBilling()
  }, [user?.id])

  const filteredTransactions = (data?.transactions ?? []).filter((transaction) => {
    if (filter === 'all') {
      return true
    }

    return transaction.category === filter
  })

  const totalDebits = (data?.transactions ?? [])
    .filter((transaction) => transaction.type === 'debit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalCredits = (data?.transactions ?? [])
    .filter((transaction) => transaction.type === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const progressPercentage = data?.semesterSummary
    ? (data.semesterSummary.daysElapsed / data.semesterSummary.totalDays) * 100
    : 0

  const handleRecharge = async () => {
    if (!user?.id) {
      return
    }

    const amount = parseInt(rechargeAmount, 10)

    if (!amount || amount < 500) {
      return
    }

    setIsSubmitting(true)

    try {
      await apiRequest('/api/student/balance', {
        method: 'POST',
        body: JSON.stringify({
          student_id: user.id,
          action: 'recharge',
          amount,
        }),
      })

      setRechargeAmount('')
      await Promise.all([loadBilling(), refreshUser()])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Track your mess expenses and transactions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Recharge Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharge Wallet</DialogTitle>
              <DialogDescription>Add money to your mess wallet. Minimum recharge amount is Rs. 500.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={rechargeAmount}
                  onChange={(event) => setRechargeAmount(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setRechargeAmount(amount.toString())}>
                    Rs. {amount}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!rechargeAmount || parseInt(rechargeAmount, 10) < 500 || isSubmitting} onClick={handleRecharge}>
                <CreditCard className="mr-2 size-4" />
                Pay Rs. {rechargeAmount || '0'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rs. {(data?.balance.remaining_balance ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(data?.semesterSummary.totalSpent ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {data?.semesterSummary.averageDaily ?? 0}</div>
            <p className="text-xs text-muted-foreground">Per day spending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Extras Spent</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(data?.semesterSummary.extraSpent ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">On extra items</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Progress</CardTitle>
          <CardDescription>Track your semester meal consumption</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days Elapsed</span>
            <span className="font-medium">{data?.semesterSummary.daysElapsed ?? 0} / {data?.semesterSummary.totalDays ?? 0} days</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Total Meals</p>
              <p className="text-xl font-semibold">{data?.semesterSummary.totalMeals ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Consumed</p>
              <p className="text-xl font-semibold">{data?.semesterSummary.mealsConsumed ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold">{(data?.semesterSummary.totalMeals ?? 0) - (data?.semesterSummary.mealsConsumed ?? 0)}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Skipped</p>
              <p className="text-xl font-semibold">{Math.max((data?.semesterSummary.daysElapsed ?? 0) * 3 - (data?.semesterSummary.mealsConsumed ?? 0), 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Spending Trend</CardTitle>
            <CardDescription>Your daily spending pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={data?.weeklyConsumption ?? []} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `Rs. ${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="total" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} strokeWidth={2} name="Total" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>This week breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                  <ArrowUpRight className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-xl font-semibold">Rs. {totalCredits.toLocaleString()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                +Rs. {totalCredits}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                  <ArrowDownRight className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-xl font-semibold">Rs. {totalDebits.toLocaleString()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                -Rs. {totalDebits}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Net Change</p>
                <p className="text-xl font-semibold">Rs. {(totalCredits - totalDebits).toLocaleString()}</p>
              </div>
              <Badge className={totalCredits - totalDebits >= 0 ? 'bg-green-600' : 'bg-red-600'}>
                {totalCredits - totalDebits >= 0 ? '+' : ''}Rs. {totalCredits - totalDebits}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your mess transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="meal">Meals</SelectItem>
                  <SelectItem value="extra">Extras</SelectItem>
                  <SelectItem value="recharge">Recharge</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', transaction.type === 'credit' ? 'text-green-600' : 'text-foreground')}>
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
  )
}
