import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseInstance) {
        if (!config.supabase.url || !config.supabase.key) {
            throw new Error('Supabase URL and Key must be provided');
        }
        supabaseInstance = createClient(config.supabase.url, config.supabase.key);
    }
    return supabaseInstance;
};

let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdminClient = (): SupabaseClient => {
    if (!supabaseAdminInstance) {
        if (!config.supabase.url || !config.supabase.serviceKey) {
            throw new Error('Supabase URL and Service Key must be provided for Admin Client: ' + config.supabase.serviceKey);
        }
        supabaseAdminInstance = createClient(config.supabase.url, config.supabase.serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseAdminInstance;
};

export const createSupabaseClient = getSupabaseClient;
