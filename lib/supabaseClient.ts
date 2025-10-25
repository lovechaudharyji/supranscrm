import { createClient } from "@supabase/supabase-js";

// Supabase credentials (hardcoded for reliability)
const supabaseUrl = "https://grjaqvdoxqendrzzgyjk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyamFxdmRveHFlbmRyenpneWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Mzk3ODIsImV4cCI6MjA3MzUxNTc4Mn0.-pCRYyL6FCPZUEQEhf_0DQY5P3RsDOJAWuUCL_6okaA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

