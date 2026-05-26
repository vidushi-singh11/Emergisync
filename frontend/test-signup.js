import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azhvotriyvbppqdtglbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aHZvdHJpeXZicHBxZHRnbGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTAxOTEsImV4cCI6MjA5NTI2NjE5MX0.cRqjZPqXYes_WOBzbx7fRVwjblMlqIaQMXyMvI0enpk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log("Signing up...", email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'ambulance',
        full_name: 'Test Ambulance',
        phone: '1234567890',
        employee_id: 'EMP123',
        organization_id: 'ORG123'
      }
    }
  });

  if (authError) {
    console.error("Signup error:", authError);
    return;
  }
  
  console.log("Signup success, UID:", authData.user.id);
  
  console.log("Logging in...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginError) {
    console.error("Login error:", loginError);
    return;
  }
  
  console.log("Login success. Fetching profile...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', loginData.user.id)
    .single();
    
  if (profileError) {
    console.error("Profile error:", profileError);
  } else {
    console.log("Profile found:", profile);
  }
}
run();
