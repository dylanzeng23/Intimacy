import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sgvvttixxwysunvtaqfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndnZ0dGl4eHd5c3VudnRhcWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjUzOTcsImV4cCI6MjA5MTkwMTM5N30.8hmVp9GDZbxkN2AOsab67jO9mEPxVwdGyvzKadv4WBA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
