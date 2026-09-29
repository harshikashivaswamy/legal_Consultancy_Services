import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Connecting to Supabase URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOtpTable() {
  const { data, error } = await supabase.from("otp_verification").select("*").limit(1);
  if (error) {
    console.log("otp_verification query status:", error.message, "code:", error.code);
  } else {
    console.log("otp_verification table found! Rows count:", data?.length);
  }
}

testOtpTable();
