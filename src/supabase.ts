// Keep this import FIRST: it must load before supabase-js.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// These two values are public: it is safe to keep them in the app because
// Row Level Security protects the data.
// NEVER put the "secret" or "service_role" key here.
const SUPABASE_URL = "https://qnpirnqltvtposxnowje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_RufAsbuC4jcS1FvRsEydgg_0kion7oe";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
