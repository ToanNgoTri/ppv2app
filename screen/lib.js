import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto' // nếu bạn dùng React Native CLI
import AsyncStorage from '@react-native-async-storage/async-storage';

const NEXT_PUBLIC_SUPABASE_URL = 'https://cppilyhbusukcmrwpvfc.supabase.co'
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'sb_publishable_nX03uX-GanUfJf3UCFRfhw_9XyM2vHs'

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
  auth: { storage: AsyncStorage },
});
export { supabase }