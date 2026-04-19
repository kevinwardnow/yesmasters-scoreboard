export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'coach' | 'agent'
  created_at: string
}

export interface Scoreboard {
  id: string
  profile_id: string
  created_at: string
  profiles?: Profile
}

export interface WeeklyEntry {
  id: string
  scoreboard_id: string
  week_number: number
  pro_days: number
  hours_practiced: number
  hours_prospected: number
  quality_conversations: number
  added_to_pc: number
  new_leads: number
  open_house_events: number
  listing_appts_set: number
  listing_appts_held: number
  listings_taken: number
  listings_sold: number
  buyer_rep: number
  buyer_sales: number
  earned_income: number
  sales_closed: number
  paid_income: number
  active_pipeline: number
  pending: number
  starting_pc_total: number
  current_pc_total: number
  created_at: string
  updated_at: string
}

export interface Goals {
  id: string
  scoreboard_id: string
  pro_days: number
  hours_practiced: number
  hours_prospected: number
  quality_conversations: number
  added_to_pc: number
  new_leads: number
  open_house_events: number
  listing_appts_set: number
  listing_appts_held: number
  listings_taken: number
  listings_sold: number
  buyer_rep: number
  buyer_sales: number
  earned_income: number
  sales_closed: number
  paid_income: number
}

export interface Cohort {
  id: string
  name: string
  coach_id: string
  created_at: string
}

export interface MarketingEntry {
  id: string
  scoreboard_id: string
  month: string
  ad_spend: number
  total_optins: number
  conversations: number
  agreements_signed: number
  deals_closed: number
  gci_from_ads: number
  created_at: string
  updated_at: string
}

export interface MarketingSettings {
  scoreboard_id: string
  enabled: boolean
  enabled_by: string
  enabled_at: string
}

export type StatusColor = 'ahead' | 'on-track' | 'behind' | 'critical'
