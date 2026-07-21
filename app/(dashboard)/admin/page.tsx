'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  Users,
  Wallet,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiRequest } from '@/lib/api-client'

type MealType = 'breakfast' | 'lunch' | 'dinner'

interface Student {
  id: string
  name: string
  email: string
  hostel: string
  room: string
  semester: number
  balance: number
  avatar?: string
}

interface MealMarking {
  id: string
  student_id: string
  student_name: string
  meal_type: MealType
  meal_category: 'veg' | 'nonveg'
  meal_price: number
  marked_at: string
  completed: boolean
}

interface AdminDashboardResponse {
  success: boolean
  data: {
    students: Student[]
    mealMarkings: MealMarking[]
    mealSummary: Record<MealType, { veg: number; nonveg: number; total: number }>
    hostelData: Array<{ name: string; value: number; fill: string }>
    weeklyRevenue: Array<{ day: string; total: number }>
    stats: {
      totalStudents: number
      totalBalance: number
      lowBalanceStudents: number
    }
  }
}

const chartConfig = {
  meals: {
    label: 'Meals',
    color: 'var(--chart-1)',
  },
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

function getTomorrowDateString() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function formatDateLabel(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [removeTimeFrame, setRemoveTimeFrame] = useState(false)
  const [isTogglingTimeFrame, setIsTogglingTimeFrame] = useState(false)
  const [completingMarkings, setCompletingMarkings] = useState<Set<string>>(new Set())
  const [selectedMealFilter, setSelectedMealFilter] = useState<MealType | 'all'>('all')
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today')

  useEffect(() => {
    void loadDashboard()
    void loadMealTimings()
  }, [])

  const loadDashboard = async (date?: string) => {
    try {
      const url = date ? `/api/admin/dashboard?date=${date}` : '/api/admin/dashboard'
      const payload = await apiRequest<AdminDashboardResponse>(url)
      if (payload.success && payload.data) {
        setData(payload.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMealTimings = async () => {
    try {
      const payload = await apiRequest<{ data: { removeTimeFrame: boolean } }>('/api/meal-timings')
      if (payload.data?.removeTimeFrame !== undefined) {
        setRemoveTimeFrame(payload.data.removeTimeFrame)
      }
    } catch (error) {
      console.error('Failed to load meal timings:', error)
    }
  }

  const handleToggleTimeFrame = async () => {
    setIsTogglingTimeFrame(true)
    try {
      const newValue = !removeTimeFrame
      const payload = await apiRequest<{ success: boolean }>('/api/meal-timings', {
        method: 'POST',
        body: JSON.stringify({ removeTimeFrame: newValue }),
      })
      if (payload.success) {
        setRemoveTimeFrame(newValue)
      }
    } catch (error) {
      console.error('Failed to toggle time frame:', error)
    } finally {
      setIsTogglingTimeFrame(false)
    }
  }

  const handleMarkMealAsCompleted = async (markingId: string) => {
    setCompletingMarkings((prev) => new Set(prev).add(markingId))
    try {
      const payload = await apiRequest<{ success: boolean }>('/api/admin/meal-markings/complete', {
        method: 'POST',
        body: JSON.stringify({ markingId }),
      })
      if (payload.success) {
        // Reload dashboard data
        await loadDashboard()
      }
    } catch (error) {
      console.error('Failed to mark meal as completed:', error)
    } finally {
      setCompletingMarkings((prev) => {
        const next = new Set(prev)
        next.delete(markingId)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  const { stats, mealSummary, weeklyRevenue, hostelData, mealMarkings, students } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage students and mess operations</p>
        </div>
        <Badge variant="outline" className="w-fit">
          Admin Mode
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalBalance).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined student wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Meals Today</CardTitle>
              <UtensilsCrossed className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => (
                <div key={mealType} className="space-y-2">
                  <p className="text-xs font-semibold capitalize">{mealType}</p>
                  <div className="ml-2 flex gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-green-700 dark:text-green-400">Veg</div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">{mealSummary[mealType].veg}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-red-700 dark:text-red-400">Non-Veg</div>
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">{mealSummary[mealType].nonveg}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Total Meals</span>
                  <span className="text-lg font-bold">{mealMarkings.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowBalanceStudents}</div>
            <p className="text-xs text-muted-foreground">Students below ₹2000</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{selectedDay === 'today' ? "Today's" : "Tomorrow's"} Meal Markings</CardTitle>
              <CardDescription>
                {selectedDay === 'today'
                  ? 'Students who marked meals today - confirm when eaten'
                  : `Meals marked for tomorrow (${formatDateLabel(getTomorrowDateString())})`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedDay === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedDay('today')
                  void loadDashboard()
                }}
              >
                Today
              </Button>
              <Button
                variant={selectedDay === 'tomorrow' ? 'default' : 'outline'}
                size="sm"
                className={selectedDay === 'tomorrow' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                onClick={() => {
                  setSelectedDay('tomorrow')
                  void loadDashboard(getTomorrowDateString())
                }}
              >
                <CalendarClock className="mr-1 size-4" />
                Tomorrow
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedMealFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMealFilter('all')}
            >
              All Meals
            </Button>
            <Button
              variant={selectedMealFilter === 'breakfast' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMealFilter('breakfast')}
            >
              Breakfast
            </Button>
            <Button
              variant={selectedMealFilter === 'lunch' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMealFilter('lunch')}
            >
              Lunch
            </Button>
            <Button
              variant={selectedMealFilter === 'dinner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMealFilter('dinner')}
            >
              Dinner
            </Button>
          </div>

          {mealMarkings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meals marked {selectedDay === 'today' ? 'today' : 'for tomorrow'}
            </p>
          ) : (
            <>
              {mealMarkings.filter((marking) =>
                selectedMealFilter === 'all' ? true : marking.meal_type === selectedMealFilter
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {selectedMealFilter} meals marked {selectedDay === 'today' ? 'today' : 'for tomorrow'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Meal Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Time Marked</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mealMarkings
                        .filter((marking) =>
                          selectedMealFilter === 'all' ? true : marking.meal_type === selectedMealFilter
                        )
                        .map((marking) => (
                    <TableRow
                      key={marking.id}
                      className={marking.completed ? 'bg-green-50 dark:bg-green-900/10' : ''}
                    >
                      <TableCell className="font-medium">{marking.student_name}</TableCell>
                      <TableCell className="capitalize">{marking.meal_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            marking.meal_category === 'veg'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          }
                        >
                          {marking.meal_category === 'veg' ? 'Veg' : 'Non-Veg'}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{marking.meal_price}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(marking.marked_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {marking.completed ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="mr-1 size-3" />
                            Eaten
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!marking.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkMealAsCompleted(marking.id)}
                            disabled={completingMarkings.has(marking.id)}
                          >
                            {completingMarkings.has(marking.id) ? 'Marking...' : 'Mark Eaten'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meal Marking Settings</CardTitle>
              <CardDescription>Control when students can mark meals</CardDescription>
            </div>
            <Clock className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Allow Anytime Marking</p>
              <p className="text-xs text-muted-foreground mt-1">
                {removeTimeFrame
                  ? 'Students can mark meals at any time'
                  : 'Students can only mark meals during scheduled times'}
              </p>
            </div>
            <Button
              onClick={handleToggleTimeFrame}
              disabled={isTogglingTimeFrame}
              variant={removeTimeFrame ? 'default' : 'outline'}
              size="sm"
            >
              {removeTimeFrame ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue</CardTitle>
          <CardDescription>Mess income from meals</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={weeklyRevenue} accessibilityLayer>
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--chart-1)" radius={4} name="Revenue" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hostel Distribution</CardTitle>
          <CardDescription>Student distribution across hostels</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={hostelData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {hostelData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Complete registered student list from the auth store</CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {students.length} students
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                    <TableCell>{student.hostel}</TableCell>
                    <TableCell>{student.room}</TableCell>
                    <TableCell>{student.semester}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          student.balance <= 2000
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        }
                      >
                        Rs. {student.balance.toLocaleString()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
