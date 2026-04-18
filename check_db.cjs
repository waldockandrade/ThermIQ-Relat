const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  console.log("Current Users in DB:");
  console.log(JSON.stringify(data?.data, null, 2));
}
check();
