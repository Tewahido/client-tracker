import { supabase } from '../supabase'
import { createLocalRepository } from './localRepository'
import { createSupabaseRepository } from './supabaseRepository'
import type { DataRepository } from './repository'

export type { BorrowerPatch, DataRepository, LoanPatch } from './repository'

/** Supabase-backed when an organisation is active, otherwise this device's local storage. */
export function createRepository(orgId: string | null): DataRepository {
  return supabase && orgId ? createSupabaseRepository(supabase, orgId) : createLocalRepository()
}
