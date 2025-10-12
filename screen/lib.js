import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto' // nếu bạn dùng React Native CLI
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://feuakoaglemujpwsspie.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldWFrb2FnbGVtdWpwd3NzcGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njg5NjYsImV4cCI6MjA3NTE0NDk2Nn0.kduWT_6GWnSyXKNCLPzGn1zcUaYO24Rtnx7fN9wtoO0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage },
});
export { supabase }