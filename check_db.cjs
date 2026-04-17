const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function hashPassword(plain) {
  // Using node crypto equivalent to crypto.subtle in browser
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(plain).digest('hex');
}

const DEFAULT_USERS_PLAIN = [
  { id: '1', name: 'Administrador',  email: 'admin@thermigenergy.com', password: 'admin', role: 'admin',  contact: '' },
  { id: '2', name: 'Operador Staff', email: 'staff@thermigenergy.com', password: 'staff', role: 'staff',  contact: '' },
]

async function test() {
  const { data } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single()
  let storedUsers = data?.data
  
  let shouldSeed = !storedUsers || !Array.isArray(storedUsers) || storedUsers.length === 0

  if (shouldSeed) {
    console.log("Seeding...");
    const seeded = await Promise.all(
      DEFAULT_USERS_PLAIN.map(async u => ({
        ...u,
        password: await hashPassword(u.password),
      }))
    )
    await supabase.from('app_data').upsert({ id: 'thermiq_users', data: seeded })
    console.log("Seeded OK");
  }

  // test login
  const { data: dbData } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single()
  const users = dbData?.data || []
  
  const hashed = await hashPassword('admin');
  const found = users.find(u => u.email.toLowerCase() === 'admin@thermigenergy.com' && u.password === hashed)

  if (found) console.log("Login SUCCESS!", found.name);
  else console.log("Login FAILED!");
}

test();
