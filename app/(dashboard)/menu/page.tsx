'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Coffee, Sun, Moon, Leaf, Drumstick } from 'lucide-react'
import { type DayMenu } from '@/lib/types'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'

const mealPrices = {
  breakfast: 40,
  lunch: 70,
  dinner: 70,
}

type MealType = 'breakfast' | 'lunch' | 'dinner'

export default function MenuPage() {
  const [menu, setMenu] = useState<DayMenu[]>([])

  useEffect(() => {
    const loadMenu = async () => {
      const payload = await apiRequest<{ success: boolean; data: DayMenu[] }>('/api/menu', {
        cache: 'no-store',
      })

      setMenu(payload.data)
    }

    void loadMenu()
  }, [])

  const getWeeklyTotal = () => (mealPrices.breakfast + mealPrices.lunch + mealPrices.dinner) * 7

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Menu</h1>
        <p className="text-muted-foreground">View this week&apos;s meal schedule. Mark meals in the "Mark Meal" section to eat.</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Weekly Meal Cost: Rs. {getWeeklyTotal()}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Live Menu:</strong> This menu now stays in sync with admin updates.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="min-w-[140px] flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30">
              <Coffee className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Breakfast</p>
              <p className="font-semibold">Rs. {mealPrices.breakfast}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
              <Sun className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lunch</p>
              <p className="font-semibold">Rs. {mealPrices.lunch}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
              <Moon className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dinner</p>
              <p className="font-semibold">Rs. {mealPrices.dinner}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Day</TableHead>
                      <TableHead><div className="flex items-center gap-2"><Coffee className="size-4" />Breakfast</div></TableHead>
                      <TableHead><div className="flex items-center gap-2"><Sun className="size-4" />Lunch</div></TableHead>
                      <TableHead><div className="flex items-center gap-2"><Moon className="size-4" />Dinner</div></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menu.map((dayMenu) => (
                      <TableRow key={dayMenu.day}>
                        <TableCell className="font-medium">{dayMenu.day}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dayMenu.breakfast.map((item) => (
                              <Badge key={item.id} variant="secondary" className={cn('text-xs', item.type === 'non-veg' && 'border-red-300 bg-red-50 dark:bg-red-900/20')}>
                                {item.type === 'veg' ? <Leaf className="mr-1 size-3 text-green-600" /> : <Drumstick className="mr-1 size-3 text-red-600" />}
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dayMenu.lunch.map((item) => (
                              <Badge key={item.id} variant="secondary" className={cn('text-xs', item.type === 'non-veg' && 'border-red-300 bg-red-50 dark:bg-red-900/20')}>
                                {item.type === 'veg' ? <Leaf className="mr-1 size-3 text-green-600" /> : <Drumstick className="mr-1 size-3 text-red-600" />}
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dayMenu.dinner.map((item) => (
                              <Badge key={item.id} variant="secondary" className={cn('text-xs', item.type === 'non-veg' && 'border-red-300 bg-red-50 dark:bg-red-900/20')}>
                                {item.type === 'veg' ? <Leaf className="mr-1 size-3 text-green-600" /> : <Drumstick className="mr-1 size-3 text-red-600" />}
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menu.map((dayMenu) => (
              <Card key={dayMenu.day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{dayMenu.day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Coffee className="size-4 text-orange-500" />
                      Breakfast
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dayMenu.breakfast.map((item) => <Badge key={item.id} variant="outline" className="text-xs">{item.name}</Badge>)}
                    </div>
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sun className="size-4 text-yellow-500" />
                      Lunch
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dayMenu.lunch.map((item) => <Badge key={item.id} variant="outline" className="text-xs">{item.name}</Badge>)}
                    </div>
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Moon className="size-4 text-indigo-500" />
                      Dinner
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dayMenu.dinner.map((item) => <Badge key={item.id} variant="outline" className={cn('text-xs', item.type === 'non-veg' && 'border-red-300')}>{item.name}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
