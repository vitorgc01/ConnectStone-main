// src/supabase.js
// npm install @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Variáveis de ambiente REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY não configuradas."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
