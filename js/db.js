import { supabase } from './supabase.js';

function getUserId() {
  return supabase.auth.getUser().then(({ data }) => data.user?.id);
}

export async function addEntry(entry) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id,
      category: entry.category || 'sex',
      date: entry.date,
      time: entry.time,
      type: entry.type,
      duration: entry.duration ?? null,
      mood: entry.mood ?? null,
      notes: entry.notes || '',
    })
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function getEntry(id) {
  const { data, error } = await supabase
    .from('entries')
    .select()
    .eq('id', id)
    .single();
  if (error) return null;
  return mapEntry(data);
}

export async function updateEntry(entry) {
  const { data, error } = await supabase
    .from('entries')
    .update({
      category: entry.category || 'sex',
      date: entry.date,
      time: entry.time,
      type: entry.type,
      duration: entry.duration ?? null,
      mood: entry.mood ?? null,
      notes: entry.notes || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', entry.id)
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function deleteEntry(id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getEntriesByDate(dateString) {
  const { data, error } = await supabase
    .from('entries')
    .select()
    .eq('date', dateString)
    .order('time');
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function getEntriesByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('entries')
    .select()
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function getAllEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select()
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function clearAllEntries() {
  const user_id = await getUserId();
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', user_id);
  if (error) throw error;
}

// Map DB column names (snake_case) to app field names (camelCase)
function mapEntry(row) {
  return {
    id: row.id,
    category: row.category || 'sex',
    date: row.date,
    time: row.time,
    type: row.type,
    duration: row.duration,
    mood: row.mood,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Settings stored in localStorage (no need for a DB table for UI prefs)
export function getSetting(key) {
  return Promise.resolve(localStorage.getItem(`setting_${key}`));
}

export function setSetting(key, value) {
  localStorage.setItem(`setting_${key}`, value);
  return Promise.resolve();
}
