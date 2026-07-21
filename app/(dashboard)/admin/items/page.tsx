'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Milk,
  Coffee,
  Cookie,
  Apple,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import type { ExtraItem } from '@/lib/mock-data'

const categoryIcons: Record<string, React.ReactNode> = {
  dairy: <Milk className="size-4" />,
  beverage: <Coffee className="size-4" />,
  snack: <Cookie className="size-4" />,
  fruit: <Apple className="size-4" />,
}

const categoryColors: Record<string, string> = {
  dairy: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  beverage: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  snack: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
  fruit: 'bg-green-100 text-green-600 dark:bg-green-900/30',
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<ExtraItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ExtraItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'dairy' as ExtraItem['category'],
    available: true,
  })

  const loadItems = async () => {
    const payload = await apiRequest<{ success: boolean; data: ExtraItem[] }>('/api/extra-items', {
      cache: 'no-store',
    })
    setItems(payload.data)
  }

  useEffect(() => {
    void loadItems()
  }, [])

  const persistItems = async (nextItems: ExtraItem[]) => {
    const payload = await apiRequest<{ success: boolean; data: ExtraItem[] }>('/api/extra-items', {
      method: 'PUT',
      body: JSON.stringify({ items: nextItems }),
    })

    setItems(payload.data)
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addItem = async () => {
    if (!newItem.name || !newItem.price) {
      return
    }

    const item: ExtraItem = {
      id: `new-${Date.now()}`,
      name: newItem.name,
      price: parseInt(newItem.price, 10),
      category: newItem.category,
      available: newItem.available,
    }

    await persistItems([...items, item])
    setNewItem({ name: '', price: '', category: 'dairy', available: true })
    setIsAddDialogOpen(false)
  }

  const updateItem = async () => {
    if (!editingItem) {
      return
    }

    await persistItems(items.map((item) => (item.id === editingItem.id ? editingItem : item)))
    setEditingItem(null)
  }

  const deleteItem = async (id: string) => {
    await persistItems(items.filter((item) => item.id !== id))
  }

  const toggleAvailability = async (id: string) => {
    await persistItems(items.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  const totalItems = items.length
  const availableItems = items.filter((item) => item.available).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Extra Items</h1>
          <p className="text-muted-foreground">Add, edit, or remove extra items and pricing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Add a new extra item to the menu</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input id="item-name" placeholder="Enter item name" value={newItem.name} onChange={(event) => setNewItem((previous) => ({ ...previous, name: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-price">Price (Rs.)</Label>
                <Input id="item-price" type="number" placeholder="Enter price" value={newItem.price} onChange={(event) => setNewItem((previous) => ({ ...previous, price: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-category">Category</Label>
                <Select value={newItem.category} onValueChange={(value: ExtraItem['category']) => setNewItem((previous) => ({ ...previous, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="fruit">Fruit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="item-available">Available</Label>
                <Switch id="item-available" checked={newItem.available} onCheckedChange={(checked) => setNewItem((previous) => ({ ...previous, available: checked }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addItem} disabled={!newItem.name || !newItem.price}>
                <Plus className="mr-2 size-4" />
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn('flex size-10 items-center justify-center rounded-lg', categoryColors.dairy)}>
              <Milk className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dairy</p>
              <p className="text-xl font-semibold">{items.filter((item) => item.category === 'dairy').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn('flex size-10 items-center justify-center rounded-lg', categoryColors.beverage)}>
              <Coffee className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Beverages</p>
              <p className="text-xl font-semibold">{items.filter((item) => item.category === 'beverage').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn('flex size-10 items-center justify-center rounded-lg', categoryColors.snack)}>
              <Cookie className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Snacks</p>
              <p className="text-xl font-semibold">{items.filter((item) => item.category === 'snack').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn('flex size-10 items-center justify-center rounded-lg', categoryColors.fruit)}>
              <Apple className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fruits</p>
              <p className="text-xl font-semibold">{items.filter((item) => item.category === 'fruit').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Extra Items</CardTitle>
              <CardDescription>{availableItems} of {totalItems} items available</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-10" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn('flex size-8 items-center justify-center rounded-lg', categoryColors[item.category])}>
                        {categoryIcons[item.category]}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">Rs. {item.price}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingItem(item)}>
                            <Edit className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Item</DialogTitle>
                            <DialogDescription>Update item details</DialogDescription>
                          </DialogHeader>
                          {editingItem && (
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Item Name</Label>
                                <Input value={editingItem.name} onChange={(event) => setEditingItem((previous) => previous ? { ...previous, name: event.target.value } : null)} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Price (Rs.)</Label>
                                <Input type="number" value={editingItem.price} onChange={(event) => setEditingItem((previous) => previous ? { ...previous, price: parseInt(event.target.value, 10) || 0 } : null)} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={editingItem.category} onValueChange={(value: ExtraItem['category']) => setEditingItem((previous) => previous ? { ...previous, category: value } : null)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="dairy">Dairy</SelectItem>
                                    <SelectItem value="beverage">Beverage</SelectItem>
                                    <SelectItem value="snack">Snack</SelectItem>
                                    <SelectItem value="fruit">Fruit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={updateItem}>
                              <Save className="mr-2 size-4" />
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
