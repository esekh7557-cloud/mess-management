'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Milk,
  Coffee,
  Cookie,
  Apple,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtraItem } from '@/lib/mock-data'
import { apiRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  dairy: <Milk className="size-5" />,
  beverage: <Coffee className="size-5" />,
  snack: <Cookie className="size-5" />,
  fruit: <Apple className="size-5" />,
}

const categoryColors: Record<string, string> = {
  dairy: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  beverage: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  snack: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
  fruit: 'bg-green-100 text-green-600 dark:bg-green-900/30',
}

export default function ExtrasPage() {
  const { user, refreshUser } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [balance, setBalance] = useState(user?.balance ?? 0)
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState<ExtraItem[]>([])

  useEffect(() => {
    if (typeof user?.balance === 'number') {
      setBalance(user.balance)
    }
  }, [user?.balance])

  useEffect(() => {
    const loadItems = async () => {
      const payload = await apiRequest<{ success: boolean; data: ExtraItem[] }>('/api/extra-items', {
        cache: 'no-store',
      })

      setItems(payload.data)
    }

    void loadItems()
  }, [])

  const addToCart = (item: ExtraItem) => {
    setCart((previous) => {
      const existing = previous.find((cartItem) => cartItem.id === item.id)

      if (existing) {
        return previous.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      }

      return [...previous, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.id === itemId)

      if (existing && existing.quantity > 1) {
        return previous.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
      }

      return previous.filter((item) => item.id !== itemId)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartQuantity = (itemId: string) => cart.find((item) => item.id === itemId)?.quantity || 0

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async () => {
    if (!user?.id || cart.length === 0) {
      return
    }

    try {
      const payload = await apiRequest<{
        success: boolean
        data: {
          balance: {
            remaining_balance: number
          }
        }
      }>('/api/student/extras', {
        method: 'POST',
        body: JSON.stringify({
          student_id: user.id,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      setOrderPlaced(true)
      setBalance(payload.data.balance.remaining_balance)
      setCart([])
      setMessage('Extra items ordered successfully.')
      await refreshUser()

      setTimeout(() => {
        setOrderPlaced(false)
        setMessage(null)
      }, 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to place order')
    }
  }

  const categories = ['all', 'dairy', 'beverage', 'snack', 'fruit']

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Extra Items</h1>
          <p className="text-muted-foreground">Order additional items from the mess</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Balance: Rs. {balance.toLocaleString()}
          </Badge>
        </div>
      </div>

      {message && (
        <Alert variant={message.includes('successfully') ? 'default' : 'destructive'}>
          {message.includes('successfully') ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Items' : category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items
                    .filter((item) => category === 'all' || item.category === category)
                    .map((item) => {
                      const quantity = getCartQuantity(item.id)

                      return (
                        <Card key={item.id} className={cn(!item.available && 'opacity-60')}>
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className={cn('flex size-12 items-center justify-center rounded-lg', categoryColors[item.category])}>
                              {categoryIcons[item.category]}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-lg font-semibold text-primary">Rs. {item.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {quantity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" className="size-8" onClick={() => removeFromCart(item.id)}>
                                    <Minus className="size-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{quantity}</span>
                                  <Button variant="outline" size="icon" className="size-8" onClick={() => addToCart(item)} disabled={!item.available}>
                                    <Plus className="size-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => addToCart(item)} disabled={!item.available}>
                                  <Plus className="mr-1 size-4" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </CardContent>
                          {!item.available && (
                            <CardFooter className="border-t bg-muted/50 px-4 py-2">
                              <span className="text-sm text-muted-foreground">Currently unavailable</span>
                            </CardFooter>
                          )}
                        </Card>
                      )
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  Your Cart
                </CardTitle>
                {cart.length > 0 && <Badge>{cartItemCount} items</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="mb-2 size-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add items to get started</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Rs. {item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rs. {item.price * item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setCart((previous) => previous.filter((cartItem) => cartItem.id !== item.id))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg text-primary">Rs. {cartTotal}</span>
                  </div>
                  {cartTotal > balance && <p className="text-sm text-destructive">Insufficient balance. Please recharge.</p>}
                </div>
              )}
            </CardContent>
            {cart.length > 0 && (
              <CardFooter className="flex flex-col gap-2">
                <Button className="w-full" onClick={placeOrder} disabled={cartTotal > balance || orderPlaced}>
                  {orderPlaced ? (
                    <>
                      <Check className="mr-2 size-4" />
                      Order Placed
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Clear Cart
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
