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

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    const raw = await readFile(STORE_PATH, 'utf-8')
    const normalized = normalizeStore(JSON.parse(raw) as AppState)
    const normalizedRaw = JSON.stringify(normalized, null, 2)

    if (raw !== normalizedRaw) {
      await writeFile(STORE_PATH, normalizedRaw, 'utf-8')
    }
  } catch {
    const initialState = seedState()
    await writeFile(STORE_PATH, JSON.stringify(initialState, null, 2), 'utf-8')
  }
}

function normalizeStore(state: AppState): AppState {
  const balances = { ...(state.balances ?? createInitialBalances()) }
  const students = [...(state.students ?? [])]

  for (const student of seededStudents) {
    if (!balances[student.id]) {
      balances[student.id] = createInitialBalance(student)
    }

    if (!students.some((item) => item.id === student.id)) {
      students.push({
        ...student,
        balance: balances[student.id]?.remaining_balance ?? student.balance,
      })
    }
  }

  const normalizedStudents = students.map((student) => ({
    ...student,
    balance: balances[student.id]?.remaining_balance ?? student.balance,
  }))

  const transactionsByStudent = {
    ...(state.transactionsByStudent ?? createInitialTransactions()),
  }

  for (const student of seededStudents) {
    if (!transactionsByStudent[student.id]) {
      transactionsByStudent[student.id] = createInitialTransactionsForStudent(student)
    }
  }

  const notificationStateByStudent = {
    ...(state.notificationStateByStudent ?? createInitialNotificationState()),
  }

  for (const student of seededStudents) {
    if (!notificationStateByStudent[student.id]) {
      notificationStateByStudent[student.id] = { readIds: [], deletedIds: [] }
    }
  }

  const accounts = [...(state.accounts ?? createInitialAccounts(balances))]

  for (const student of normalizedStudents) {
    if (!accounts.some((account) => account.id === student.id)) {
      accounts.push({
        id: student.id,
        name: student.name,
        email: student.email,
        password: DEFAULT_STUDENT_PASSWORD,
        role: 'student',
        hostel: student.hostel,
        room: student.room,
        semester: student.semester,
        balance: balances[student.id]?.remaining_balance ?? student.balance,
      })
    }
  }

  if (!accounts.some((account) => account.role === 'admin')) {
    accounts.push(DEFAULT_ADMIN_ACCOUNT)
  }

  const nextState: AppState = {
    accounts,
    students: normalizedStudents,
    balances,
    transactionsByStudent,
    notifications: state.notifications ?? seededNotifications,
    notificationStateByStudent,
    mealMarkings: state.mealMarkings ?? [],
    mealTimings: state.mealTimings ?? defaultMealSelectionTimings,
    weeklyMenu: state.weeklyMenu ?? weeklyMenu,
    extraItems: state.extraItems ?? extraItems,
  }

  return nextState
}

export async function readStore(): Promise<AppState> {
  await ensureStoreFile()
  const raw = await readFile(STORE_PATH, 'utf-8')
  return normalizeStore(JSON.parse(raw) as AppState)
}

async function writeStore(nextState: AppState) {
  await writeFile(STORE_PATH, JSON.stringify(nextState, null, 2), 'utf-8')
}

export async function updateStore<T>(updater: (state: AppState) => T | Promise<T>) {
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
