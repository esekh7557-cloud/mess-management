'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Wallet, Plus, RotateCcw, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api-client'

interface StudentBalanceRow {
  id: string
  name: string
  email: string
  balanceDetails: {
    total_balance: number
    used_balance: number
    remaining_balance: number
  }
}

export default function AdminBalancesPage() {
  const [students, setStudents] = useState<StudentBalanceRow[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadBalances = async () => {
    const payload = await apiRequest<{ success: boolean; data: StudentBalanceRow[] }>('/api/admin/balances', {
      cache: 'no-store',
    })
    setStudents(payload.data)
  }

  useEffect(() => {
    void loadBalances()
  }, [])

  const handleRecharge = async (studentId: string, amount: number) => {
    if (amount <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0' })
      return
    }

    setLoading(true)

    try {
      const payload = await apiRequest<{ success: boolean; data: StudentBalanceRow[] }>('/api/admin/balances', {
        method: 'PATCH',
        body: JSON.stringify({
          studentId,
          action: 'recharge',
          amount,
        }),
      })

      setStudents(payload.data)
      setMessage({ type: 'success', text: `Recharged Rs. ${amount} to ${studentId}` })
      setRechargeAmount('')
      setSelectedStudent(null)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to recharge balance' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (studentId: string) => {
    if (!window.confirm('Reset balance to Rs. 10,000 for this student?')) {
      return
    }

    setLoading(true)

    try {
      const payload = await apiRequest<{ success: boolean; data: StudentBalanceRow[] }>('/api/admin/balances', {
        method: 'PATCH',
        body: JSON.stringify({
          studentId,
          action: 'reset',
        }),
      })

      setStudents(payload.data)
      setMessage({ type: 'success', text: `Balance reset for ${studentId}` })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to reset balance' })
    } finally {
      setLoading(false)
    }
  }

  const totalActive = students.length
  const totalOutstanding = students.reduce((sum, student) => sum + student.balanceDetails.used_balance, 0)
  const totalDeposited = students.reduce((sum, student) => sum + student.balanceDetails.total_balance, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student Balance Management</h1>
        <p className="text-muted-foreground">Manage and recharge student meal wallet balances</p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'error' && <AlertCircle className="size-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
            <p className="text-xs text-muted-foreground">With wallet accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
            <Plus className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalDeposited.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total balance across all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <RotateCcw className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Amount spent on meals</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Balances</CardTitle>
          <CardDescription>View and manage individual student balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const balance = student.balanceDetails
                  const isLow = balance.remaining_balance < 500

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">Rs. {balance.total_balance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">Rs. {balance.used_balance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={isLow ? 'font-semibold text-orange-600' : 'font-semibold'}>
                          Rs. {balance.remaining_balance.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isLow ? <Badge variant="destructive">Low Balance</Badge> : <Badge variant="secondary">Normal</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student.id)}>
                                Recharge
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Recharge Balance</DialogTitle>
                                <DialogDescription>Add funds to {student.name}&apos;s wallet</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Amount (Rs.)</Label>
                                  <Input type="number" placeholder="Enter amount" value={rechargeAmount} onChange={(event) => setRechargeAmount(event.target.value)} min="100" step="100" />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRechargeAmount('')}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleRecharge(student.id, parseInt(rechargeAmount || '0', 10))} disabled={!rechargeAmount || loading}>
                                  Recharge
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" onClick={() => handleReset(student.id)} disabled={loading}>
                            Reset
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-base">Balance Management Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Default balance for new students: Rs. 10,000</p>
          <p>Minimum recommended balance: Rs. 500</p>
          <p>Recharge amount: Any amount above Rs. 100</p>
          <p>Used balance is now calculated from real synced meal and extra orders.</p>
          <p>Reset restores the student wallet to the default Rs. 10,000 balance.</p>
        </CardContent>
      </Card>
    </div>
  )
}
