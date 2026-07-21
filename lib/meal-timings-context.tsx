'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { MealSelectionTimings, defaultMealSelectionTimings } from './mock-data'

interface MealTimingsContextType {
  timings: MealSelectionTimings
  updateTimings: (newTimings: MealSelectionTimings) => void
  isMealOpen: (meal: 'breakfast' | 'lunch' | 'dinner') => boolean
  getMealStatus: (meal: 'breakfast' | 'lunch' | 'dinner') => {
    isOpen: boolean
    startTime: string
    endTime: string
  }
}

const MealTimingsContext = createContext<MealTimingsContextType | undefined>(undefined)

export function MealTimingsProvider({ children }: { children: ReactNode }) {
  const [timings, setTimings] = useState<MealSelectionTimings>(defaultMealSelectionTimings)

  const parseTime = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const getCurrentTimeInMinutes = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return parseTime(hours + ':' + minutes)
  }

  const isMealOpen = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    // If time frame is removed, all meals are always open
    if (timings.removeTimeFrame) {
      return true
    }

    const mealTiming = timings[meal]
    const currentMinutes = getCurrentTimeInMinutes()
    const startMinutes = parseTime(mealTiming.startTime)
    const endMinutes = parseTime(mealTiming.endTime)

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  const getMealStatus = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const mealTiming = timings[meal]
    return {
      isOpen: isMealOpen(meal),
      startTime: mealTiming.startTime,
      endTime: mealTiming.endTime,
    }
  }

  const updateTimings = (newTimings: MealSelectionTimings) => {
    setTimings(newTimings)
  }

  return (
    <MealTimingsContext.Provider value={{ timings, updateTimings, isMealOpen, getMealStatus }}>
      {children}
    </MealTimingsContext.Provider>
  )
}

export function useMealTimings() {
  const context = useContext(MealTimingsContext)
  if (context === undefined) {
    throw new Error('useMealTimings must be used within a MealTimingsProvider')
  }
  return context
}
