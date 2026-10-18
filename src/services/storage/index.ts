import { supabase } from '../supabase'
import { createLocalRepository } from './localRepository'
import { createSupabaseRepository } from './supabaseRepository'
import type { DataRepository } from './repository'

export type { BorrowerPatch, DataRepository, LoanPatch } from './repository'

export function createRepository(): DataRepository {
  return supabase ? createSupabaseRepository(supabase) : createLocalRepository()
}
