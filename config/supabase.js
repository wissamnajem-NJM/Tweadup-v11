const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://notynicooqpnhqnxazzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdHluaWNvb3FwbmhxbnhhenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzUxMzQsImV4cCI6MjA5ODA1MTEzNH0.DGCMU-CM-4bCyL6J-wb4OoyEyaKXBiUDkeMyW3hVPtA';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;