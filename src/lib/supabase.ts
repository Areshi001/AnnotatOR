import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const createMissingConfigProxy = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
        );
      },
    },
  ) as ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase environment variables are missing. The app will render, but database actions will fail until they are configured.',
  );
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createMissingConfigProxy();
