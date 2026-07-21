import 'server-only'

import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import {
  defaultMealSelectionTimings,
  extraItems,
  mealMarkingsRecords as seededMealMarkings,
  notifications as seededNotifications,
  studentBalancesRecord as seededBalances,
  students as seededStudents,
  weeklyMenu,
  type DayMenu,
  type ExtraItem,
  type MealSelectionTimings,
  type Notification,
  type Student,
  type StudentBalance,
  type Transaction,
} from './mock-data'

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type MealCategory = 'veg' | 'nonveg'
export type UserRole = 'student' | 'admin'

export interface UserAccount {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  hostel?: string
  room?: string
  semester?: number
  balance?: number
}

export interface MealMarkingRecord {
  id: string
  student_id: string
  student_name: string
  meal_type: MealType
  meal_category: MealCategory
  meal_price: number
  marked_at: string
  completed: boolean
}

interface StudentNotificationState {
  readIds: string[]
  deletedIds: string[]
}

export interface AppState {
  accounts: UserAccount[]
  students: Student[]
  balances: Record<string, StudentBalance>
  transactionsByStudent: Record<string, Transaction[]>
  notifications: Notification[]
  notificationStateByStudent: Record<string, StudentNotificationState>
  mealMarkings: MealMarkingRecord[]
  mealTimings: MealSelectionTimings
  weeklyMenu: DayMenu[]
  extraItems: ExtraItem[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'mess-store.json')
const DEFAULT_WALLET_BALANCE = 10000
const LOW_BALANCE_THRESHOLD = 500
const DEFAULT_STUDENT_PASSWORD = 'password'
const DEFAULT_ADMIN_ACCOUNT: UserAccount = {
  id: 'ADM001',
  name: 'Admin User',
  email: 'admin@college.edu',
  password: 'password',
  role: 'admin',
}

let writeQueue = Promise.resolve()

function withTodayTimestamp(isoTimestamp: string) {
  const original = new Date(isoTimestamp)
  const now = new Date()

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    original.getUTCHours(),
    original.getUTCMinutes(),
    original.getUTCSeconds()
  ).toISOString()
}

function createInitialBalance(student: Student): StudentBalance {
  const seededBalance = seededBalances[student.id]

  if (seededBalance) {
    return seededBalance
  }

  return {
    student_id: student.id,
    total_balance: DEFAULT_WALLET_BALANCE,
    used_balance: DEFAULT_WALLET_BALANCE - student.balance,
    remaining_balance: student.balance,
  }
}

function createInitialTransactionsForStudent(student: Student): Transaction[] {
  const rechargeAmount = DEFAULT_WALLET_BALANCE
  const spentAmount = DEFAULT_WALLET_BALANCE - student.balance

  return [
    {
      id: `seed-recharge-${student.id}`,
      date: new Date().toISOString().split('T')[0],
      description: 'Opening Wallet Balance',
      amount: rechargeAmount,
      type: 'credit',
      category: 'recharge',
    },
    ...(spentAmount > 0
      ? [
          {
            id: `seed-meals-${student.id}`,
            date: new Date().toISOString().split('T')[0],
            description: 'Previous Meal Charges',
            amount: spentAmount,
            type: 'debit' as const,
            category: 'meal' as const,
          },
        ]
      : []),
  ]
}

function createInitialBalances() {
  return seededStudents.reduce<Record<string, StudentBalance>>((acc, student) => {
    acc[student.id] = createInitialBalance(student)
    return acc
  }, {})
}

function createInitialTransactions() {
  return seededStudents.reduce<Record<string, Transaction[]>>((acc, student) => {
    acc[student.id] = createInitialTransactionsForStudent(student)
    return acc
  }, {})
}

function createInitialNotificationState() {
  return seededStudents.reduce<Record<string, StudentNotificationState>>((acc, student) => {
    acc[student.id] = { readIds: [], deletedIds: [] }
    return acc
  }, {})
}

function createInitialAccounts(balances: Record<string, StudentBalance>) {
  return [
    ...seededStudents.map<UserAccount>((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      password: DEFAULT_STUDENT_PASSWORD,
      role: 'student',
      hostel: student.hostel,
      room: student.room,
      semester: student.semester,
      balance: balances[student.id]?.remaining_balance ?? student.balance,
    })),
    DEFAULT_ADMIN_ACCOUNT,
  ]
}

function seedState(): AppState {
  const balances = createInitialBalances()

  return {
    accounts: createInitialAccounts(balances),
    students: seededStudents.map((student) => ({
      ...student,
      balance: balances[student.id]?.remaining_balance ?? student.balance,
    })),
    balances,
    transactionsByStudent: createInitialTransactions(),
    notifications: seededNotifications,
    notificationStateByStudent: createInitialNotificationState(),
    mealMarkings: seededMealMarkings.map((marking) => ({
      ...marking,
      marked_at: withTodayTimestamp(marking.marked_at),
    })),
    mealTimings: defaultMealSelectionTimings,
    weeklyMenu,
    extraItems,
  }
}

import { createAdminClient } from './supabase'

const supabase = createAdminClient()

async function fetchStoreFromSupabase(): Promise<AppState> {
  const [
    { data: users },
    { data: markings },
    { data: transactions },
    { data: notifications },
    { data: extra },
    { data: menu },
    { data: settings }
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('meal_markings').select('*').order('marked_at', { ascending: false }),
    supabase.from('transactions').select('*').order('date', { ascending: false }),
    supabase.from('notifications').select('*').order('date', { ascending: false }),
    supabase.from('extra_items').select('*'),
    supabase.from('weekly_menu').select('*'),
    supabase.from('app_settings').select('*')
  ])

  const state: AppState = {
    accounts: users || [],
    students: (users || []).filter(u => u.role === 'student') as Student[],
    balances: {},
    transactionsByStudent: {},
    notifications: notifications || [],
    notificationStateByStudent: {},
    mealMarkings: markings || [],
    mealTimings: settings?.find(s => s.key === 'meal_timings')?.value || defaultMealSelectionTimings,
    weeklyMenu: menu || weeklyMenu,
    extraItems: extra || extraItems
  }

  // Populate balances and transactions map
  state.students.forEach(student => {
    state.balances[student.id] = {
      student_id: student.id,
      total_balance: DEFAULT_WALLET_BALANCE,
      used_balance: DEFAULT_WALLET_BALANCE - (student.balance || 0),
      remaining_balance: student.balance || 0
    }
    state.transactionsByStudent[student.id] = []
  })

  transactions?.forEach(tx => {
    if (!state.transactionsByStudent[tx.student_id]) {
      state.transactionsByStudent[tx.student_id] = []
    }
    state.transactionsByStudent[tx.student_id].push(tx)
  })

  return state
}

async function writeStore(state: AppState) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

export async function readStore(): Promise<AppState> {
  try {
    const content = await readFile(STORE_PATH, 'utf8')
    return JSON.parse(content) as AppState
  } catch {
    const state = seedState()
    await writeStore(state)
    return state
  }
}

export async function updateStore<T>(updater: (state: AppState) => Promise<T> | T): Promise<T> {
  let result!: T

  writeQueue = writeQueue.then(async () => {
    const state = await readStore()
    result = await updater(state)
    await writeStore(state)
  })

  await writeQueue
  return result
}

export function getStudentById(state: AppState, studentId: string) {
  return state.students.find((student) => student.id === studentId) ?? null
}

export function syncStudentBalance(state: AppState, studentId: string) {
  const student = getStudentById(state, studentId)
  const balance = state.balances[studentId]
  const account = state.accounts.find((item) => item.id === studentId)

  if (student && balance) {
    student.balance = balance.remaining_balance
  }

  if (account && balance) {
    account.balance = balance.remaining_balance
  }
}

export function getTodayMealMarkings(state: AppState) {
  const today = new Date().toISOString().split('T')[0]
  return state.mealMarkings.filter((marking) => marking.marked_at.startsWith(today))
}

export function getMealMarkingsForDate(state: AppState, date: string) {
  return state.mealMarkings.filter((marking) => marking.marked_at.startsWith(date))
}

export function getStudentTransactions(state: AppState, studentId: string) {
  return state.transactionsByStudent[studentId] ?? []
}

export function getStudentVisibleNotifications(state: AppState, studentId: string) {
  const studentState = state.notificationStateByStudent[studentId] ?? {
    readIds: [],
    deletedIds: [],
  }

  return state.notifications
    .filter((notification) => !studentState.deletedIds.includes(notification.id))
    .map((notification) => ({
      ...notification,
      read: studentState.readIds.includes(notification.id),
    }))
}

export function upsertStudentNotificationState(state: AppState, studentId: string) {
  if (!state.notificationStateByStudent[studentId]) {
    state.notificationStateByStudent[studentId] = { readIds: [], deletedIds: [] }
  }

  return state.notificationStateByStudent[studentId]
}

export function addTransaction(state: AppState, studentId: string, transaction: Transaction) {
  if (!state.transactionsByStudent[studentId]) {
    state.transactionsByStudent[studentId] = []
  }

  state.transactionsByStudent[studentId].unshift(transaction)
}

export function getLowBalanceNotification(studentName: string, remainingBalance: number): Notification {
  return {
    id: `notif-low-balance-${Date.now()}`,
    title: 'Balance Low Alert',
    message: `${studentName}'s wallet is low. Remaining balance is Rs. ${remainingBalance}.`,
    date: new Date().toISOString().split('T')[0],
    type: 'warning',
    read: false,
  }
}

export function shouldCreateLowBalanceAlert(remainingBalance: number) {
  return remainingBalance > 0 && remainingBalance <= LOW_BALANCE_THRESHOLD
}

export function getAccountByEmail(state: AppState, email: string) {
  return state.accounts.find((account) => account.email.toLowerCase() === email.toLowerCase()) ?? null
}

export function getAccountByIdentifier(state: AppState, identifier: string) {
  const normalizedIdentifier = identifier.toLowerCase()

  return (
    state.accounts.find(
      (account) =>
        account.email.toLowerCase() === normalizedIdentifier ||
        account.id.toLowerCase() === normalizedIdentifier
    ) ?? null
  )
}
