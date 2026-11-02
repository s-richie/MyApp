import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://qnpirnqltvtposxnowje.supabase.co/rest/v1/";
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
