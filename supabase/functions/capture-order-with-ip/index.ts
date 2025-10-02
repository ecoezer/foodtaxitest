import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const orderData = await req.json();
    
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                      req.headers.get("x-real-ip") ||
                      "unknown";

    const orderWithMetadata = {
      customer_name: orderData.customer_name,
      phone: orderData.phone,
      address: orderData.address,
      items: orderData.items,
      total_amount: orderData.total_amount,
      status: orderData.status || "pending",
      created_at: new Date().toISOString(),
      ip_address: ipAddress,
      device_info: orderData.device_info
    };

    const { data, error } = await supabaseClient
      .from("orders")
      .insert([orderWithMetadata])
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, order: data[0] }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});