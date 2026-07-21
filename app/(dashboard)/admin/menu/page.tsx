'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Coffee,
  Sun,
  Moon,
  Plus,
  Trash2,
  Leaf,
  Drumstick,
  Save,
} from 'lucide-react'
import type { DayMenu, MenuItem } from '@/lib/mock-data'
import { apiRequest } from '@/lib/api-client'

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<DayMenu[]>([])
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', type: 'veg', meal: 'breakfast' })
  const [saving, setSaving] = useState(false)

  const loadMenu = async () => {
    const payload = await apiRequest<{ success: boolean; data: DayMenu[] }>('/api/menu', {
      cache: 'no-store',
    })
    setMenu(payload.data)
    if (payload.data[0]) {
      setSelectedDay((current) => current || payload.data[0].day)
    }
  }

  useEffect(() => {
    void loadMenu()
  }, [])

  const currentDayMenu = menu.find((day) => day.day === selectedDay)

  const addMenuItem = () => {
    if (!newItem.name || !currentDayMenu) {
      return
    }

    const newMenuItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: newItem.name,
      type: newItem.type as 'veg' | 'non-veg',
    }

    setMenu((previous) =>
      previous.map((day) =>
        day.day !== selectedDay
          ? day
          : {
              ...day,
              [newItem.meal]: [...day[newItem.meal as keyof Pick<DayMenu, 'breakfast' | 'lunch' | 'dinner'>], newMenuItem],
            }
      )
    )

    setNewItem({ name: '', type: 'veg', meal: 'breakfast' })
    setIsAddDialogOpen(false)
  }

  const removeMenuItem = (meal: 'breakfast' | 'lunch' | 'dinner', itemId: string) => {
    setMenu((previous) =>
      previous.map((day) =>
        day.day !== selectedDay
          ? day
          : {
              ...day,
              [meal]: day[meal].filter((item) => item.id !== itemId),
            }
      )
    )
  }

  const saveMenu = async () => {
    setSaving(true)
    try {
      const payload = await apiRequest<{ success: boolean; data: DayMenu[] }>('/api/menu', {
        method: 'PUT',
        body: JSON.stringify({ menu }),
      })
      setMenu(payload.data)
    } finally {
      setSaving(false)
    }
  }

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner', icon: React.ReactNode, label: string) => {
    if (!currentDayMenu) {
      return null
    }

    const allItems = currentDayMenu[mealType]
    const vegItems = allItems.filter((item) => item.type === 'veg')
    const nonvegItems = allItems.filter((item) => item.type === 'non-veg')

    return (
      <div key={mealType} className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{label}</h3>
        </div>

        <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/10">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-green-600" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">Vegetarian</span>
            <span className="text-xs text-green-700 dark:text-green-300">({vegItems.length})</span>
          </div>
          {vegItems.length > 0 ? (
            <div className="space-y-2">
              {vegItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded bg-white p-2 dark:bg-gray-950">
                  <span className="text-sm">{item.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeMenuItem(mealType, item.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 dark:text-green-300">No veg items added</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <div className="flex items-center gap-2">
            <Drumstick className="size-4 text-red-600" />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">Non-Vegetarian</span>
            <span className="text-xs text-red-700 dark:text-red-300">({nonvegItems.length})</span>
          </div>
          {nonvegItems.length > 0 ? (
            <div className="space-y-2">
              {nonvegItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded bg-white p-2 dark:bg-gray-950">
                  <span className="text-sm">{item.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeMenuItem(mealType, item.id)} className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-red-700 dark:text-red-300">No non-veg items added</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Menu</h1>
          <p className="text-muted-foreground">Edit the weekly mess menu with veg and non-veg options</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {menu.map((day) => (
                <SelectItem key={day.day} value={day.day}>
                  {day.day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>Add a new item to {selectedDay} menu</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input id="item-name" placeholder="Enter item name" value={newItem.name} onChange={(event) => setNewItem((previous) => ({ ...previous, name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meal-type">Meal</Label>
                  <Select value={newItem.meal} onValueChange={(value) => setNewItem((previous) => ({ ...previous, meal: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="food-type">Type</Label>
                  <Select value={newItem.type} onValueChange={(value) => setNewItem((previous) => ({ ...previous, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMenuItem} disabled={!newItem.name}>
                  <Plus className="mr-2 size-4" />
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                <Coffee className="size-5" />
              </div>
              <div>
                <CardTitle>Breakfast</CardTitle>
                <CardDescription>Veg and non-veg options for {selectedDay}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderMealSection('breakfast', <Coffee className="size-5 text-orange-500" />, 'Breakfast Items')}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
                <Sun className="size-5" />
              </div>
              <div>
                <CardTitle>Lunch</CardTitle>
                <CardDescription>Veg and non-veg options for {selectedDay}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderMealSection('lunch', <Sun className="size-5 text-yellow-500" />, 'Lunch Items')}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                <Moon className="size-5" />
              </div>
              <div>
                <CardTitle>Dinner</CardTitle>
                <CardDescription>Veg and non-veg options for {selectedDay}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderMealSection('dinner', <Moon className="size-5 text-indigo-500" />, 'Dinner Items')}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>Complete menu for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Day</TableHead>
                  <TableHead>Breakfast</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Dinner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menu.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell className="font-medium">{day.day}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {day.breakfast.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {day.breakfast.length > 3 && <Badge variant="outline" className="text-xs">+{day.breakfast.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {day.lunch.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {day.lunch.length > 3 && <Badge variant="outline" className="text-xs">+{day.lunch.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {day.dinner.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {day.dinner.length > 3 && <Badge variant="outline" className="text-xs">+{day.dinner.length - 3}</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={saveMenu} disabled={saving}>
          <Save className="mr-2 size-4" />
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
