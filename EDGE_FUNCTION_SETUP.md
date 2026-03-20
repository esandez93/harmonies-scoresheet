# Edge Function para Invitaciones por Email

Este documento contiene la Edge Function necesaria para enviar emails de invitación usando Brevo.

## Setup de Edge Function

### 1. Crear la Edge Function

En tu proyecto Supabase:

1. Ve a **Edge Functions**
2. Click en **Create a new function**
3. Nombre: `send_game_invitation`
4. Presiona **Create**

### 2. Obtener API Key de Brevo

1. Ve a https://www.brevo.com/
2. Sign up (gratis)
3. Ve a **Settings > SMTP & API**
4. Copia tu **API Key**

### 3. Configurar Secrets en Supabase

1. En tu Edge Function `send_game_invitation`
2. Click **Settings**
3. Click **Add new secret**
4. Name: `BREVO_API_KEY`
5. Value: Tu API key de Brevo
6. Click **Save**

### 4. Código de la Edge Function

Reemplaza el contenido COMPLETO con esto:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface InvitationRequest {
  gameId: string;
  invitedEmail: string;
  invitedUsername?: string;
  gameTitle: string;
  invitedByUsername: string;
  invitationToken: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== Function invoked ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const {
      gameId,
      invitedEmail,
      invitedUsername,
      gameTitle,
      invitedByUsername,
      invitationToken,
    } = body;

    // Validate required fields
    if (
      !gameId ||
      !invitedEmail ||
      !gameTitle ||
      !invitedByUsername ||
      !invitationToken
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          }
        }
      );
    }

    // Get Brevo API Key from secrets
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error(
        "BREVO_API_KEY not configured. Configure it in Edge Function settings."
      );
    }

    // Build invitation URL
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const invitationUrl = `${appUrl}/invite/${invitationToken}`;

    // Determine email subject and body
    const foundUser = !!invitedUsername;

    const subject = foundUser
      ? `You're invited to play Harmonies!`
      : `Join us in Harmonies!`;

    const htmlBody = foundUser
      ? buildFoundUserEmail(
          invitedUsername,
          gameTitle,
          invitedByUsername,
          invitationUrl
        )
      : buildNewUserEmail(
          gameTitle,
          invitedByUsername,
          invitationUrl,
          invitedEmail
        );

    // Send email using Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: "Harmonies", email: "esandez93@gmail.com" },
        to: [{ email: invitedEmail }],
        subject: subject,
        htmlContent: htmlBody,
      }),
    });

    if (!brevoResponse.ok) {
      const error = await brevoResponse.json();
      console.error("Brevo API error:", error);
      throw new Error(
        `Failed to send email: ${error.message || brevoResponse.statusText}`
      );
    }

    const brevoData = await brevoResponse.json();
    console.log("Email sent successfully via Brevo:", brevoData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: brevoData.messageId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 500,
      }
    );
  }
});

function buildFoundUserEmail(
  username: string,
  gameTitle: string,
  invitedByUsername: string,
  invitationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .content p { margin: 12px 0; line-height: 1.6; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #5568d3; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p><strong>${invitedByUsername}</strong> has invited you to join a game of <strong>${gameTitle}</strong> in Harmonies Scoresheet!</p>
            <p><a href="${invitationUrl}" class="button">Accept Invitation</a></p>
            <p>Or copy this link:</p>
            <p><a href="${invitationUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">${invitationUrl}</a></p>
            <p>Happy playing! 🎵</p>
          </div>
          <div class="footer">
            <p>This invitation link expires in 30 days.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildNewUserEmail(
  gameTitle: string,
  invitedByUsername: string,
  invitationUrl: string,
  invitedEmail: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .content p { margin: 12px 0; line-height: 1.6; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #5568d3; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 Join Harmonies Scoresheet!</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${invitedByUsername}</strong> has invited you to join a game of <strong>${gameTitle}</strong>.</p>
            <p>Harmonies Scoresheet is a web app for tracking scores during the tabletop game <strong>Harmonies</strong>.</p>
            <p><a href="${invitationUrl}" class="button">Accept Invitation & Create Account</a></p>
            <p>Or copy this link:</p>
            <p><a href="${invitationUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">${invitationUrl}</a></p>
            <p>Once you accept, you'll be guided to create your account and join the game immediately!</p>
            <p>Let's play! 🎵</p>
          </div>
          <div class="footer">
            <p>This invitation link expires in 30 days.</p>
            <p>You were invited as: <strong>${invitedEmail}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### 5. Deploy

1. Copy the full TypeScript code above
2. Paste it into Supabase > Edge Functions > `send_game_invitation`
3. Click **Deploy**

---

## ✅ Por qué Brevo

✅ **Gratis**: 300 emails/day
✅ **Sin restricciones**: Puedes enviar a cualquier email
✅ **Sin verificación de dominio**: Funciona inmediatamente
✅ **Confiable**: Servicio profesional de transactional emails

---

¡Listo! Ahora:

1. **Ve a https://www.brevo.com/ y crea tu cuenta**
2. **Obtén tu API Key** de Settings > SMTP & API
3. **Agrega el secret en Supabase**
4. **Copia y deploya el código arriba en tu Edge Function**
5. **Recarga la app y prueba invitar**
