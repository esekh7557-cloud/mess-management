const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: allMarkings, error } = await supabase.from('meal_markings').select('*, users(name)').order('marked_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(allMarkings, null, 2));
}
run();
