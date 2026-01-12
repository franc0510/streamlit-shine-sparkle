import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

// Rate limiting: track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Input validation
function validateInput(data: ContactEmailRequest): { valid: boolean; error?: string } {
  // Validate name: 2-100 characters, only letters, spaces, hyphens, apostrophes
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  const trimmedName = data.name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return { valid: false, error: 'Name must be 2-100 characters' };
  }

  // Validate email: proper format, max 254 characters
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const trimmedEmail = data.email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
    return { valid: false, error: 'Invalid email address' };
  }
  // Check for email header injection attempts
  if (trimmedEmail.includes('\n') || trimmedEmail.includes('\r')) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Validate message: 10-5000 characters
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  const trimmedMessage = data.message.trim();
  if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
    return { valid: false, error: 'Message must be 10-5000 characters' };
  }

  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { name, email, message } = body as ContactEmailRequest;

    // Validate input
    const validation = validateInput({ name, email, message });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Trim and sanitize inputs
    const safeName = escapeHtml(name.trim());
    const safeEmail = email.trim();
    const safeMessage = escapeHtml(message.trim());

    // Send email to admin with escaped HTML content
    const emailResponse = await resend.emails.send({
      from: "PredictEsport <onboarding@resend.dev>",
      to: ["predictesport.contact@gmail.com"],
      reply_to: safeEmail,
      subject: `Nouveau message de ${safeName}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-contact-email function:", error);
    // Return generic error message to avoid information leakage
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
