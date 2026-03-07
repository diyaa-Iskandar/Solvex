import { createClient } from "@supabase/supabase-js";

// تم وضع الروابط والمفاتيح مباشرة كما طلبت
const supabaseUrl = "https://wwllnbvwsvsedvjbvszk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bGxuYnZ3c3ZzZWR2amJ2c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njk2NDcsImV4cCI6MjA4ODE0NTY0N30.2WP7LwkFEJun2xO9QdGoOwR3yOLDsXZyADFVJJR046s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
