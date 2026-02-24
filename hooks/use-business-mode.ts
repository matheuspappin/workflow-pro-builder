"use client"

import { useVocabulary } from "@/hooks/use-vocabulary"
import { getBusinessMode, BUSINESS_MODES } from "@/config/business-modes"

export function useBusinessMode() {
  const { niche } = useVocabulary()
  
  const mode = getBusinessMode(niche || 'dance') // default to dance/SCHEDULE_BASED if no niche
  
  return {
    mode,
    isScheduleBased: mode === BUSINESS_MODES.SCHEDULE_BASED,
    isServiceOrderBased: mode === BUSINESS_MODES.SERVICE_ORDER_BASED
  }
}
