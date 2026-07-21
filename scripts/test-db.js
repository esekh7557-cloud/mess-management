const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('meal_markings')
    .select('*')
    .like('marked_at', '2026-07-22%');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
