# Edge Function para Invitaciones - Solución Simplificada

## El Problema

`sendRawEmail()` requiere acceso a `auth.users` que causa errores de permisos.

## La Solución: Mockear Emails (Desarrollo) o Usar Resend (Producción)

### OpciónA: MOCKEAR EMAILS (Para Desarrollo Rápido)

Si solo quieres probar que el sistema de invitaciones funciona sin enviar emails reales, reemplaza el código de la Edge Function con esto:

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

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const {
      gameId,
      invitedEmail,
      invitedUsername,
      gameTitle,
      invitedByUsername,
      invitationToken,
    } = await req.json() as InvitationRequest;

    if (
      !gameId ||
      !invitedEmail ||
      !gameTitle ||
      !invitedByUsername ||
      !invitationToken
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🎭 MOCK MODE - Simula envío de email
    console.log("📧 [MOCK EMAIL] Invitation sent:");
    console.log(`   To: ${invitedEmail}`);
    console.log(`   Username: ${invitedUsername || "N/A"}`);
    console.log(`   Game: ${gameTitle}`);
    console.log(`   From: ${invitedByUsername}`);
    console.log(
      `   Invitation Link: https://app.example.com/invite/${invitationToken}`
    );

    return new Response(
      JSON.stringify({ success: true, message: "Email mocked (development mode)" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ Puedes probar todo el flujo sin problemas de permisos
- ✅ Los logs muestran qué emails se "enviaron"

**Desventajas:**
- ❌ No envía emails reales
- ❌ Solo para desarrollo

---

### Opción B: USAR RESEND (Para Producción)

Para enviar emails reales sin problemas de permisos, usa Resend (es gratis hasta 100 emails/día):

1. **Crea cuenta en Resend:**
   - Ve a https://resend.com
   - Sign up gratis
   - Copia tu API Key

2. **Configura la variable de entorno en Supabase:**
   - Ve a Edge Functions
   - Click en `send_game_invitation`
   - Ve a **Settings**
   - Añade variable: `RESEND_API_KEY` = tu_api_key_de_resend

3. **Reemplaza el código de la Edge Function:**

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

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const {
      gameId,
      invitedEmail,
      invitedUsername,
      gameTitle,
      invitedByUsername,
      invitationToken,
    } = await req.json() as InvitationRequest;

    if (
      !gameId ||
      !invitedEmail ||
      !gameTitle ||
      !invitedByUsername ||
      !invitationToken
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const invitationUrl = `${appUrl}/invite/${invitationToken}`;
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

    // Enviar email con Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "noreply@harmonies-scoresheet.com",
        to: invitedEmail,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent via Resend" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
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
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 Game Invitation</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p><strong>${invitedByUsername}</strong> has invited you to join a game of <strong>${gameTitle}</strong> in Harmonies Scoresheet!</p>
            <p>Click the button below to accept the invitation and start playing:</p>
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
            <p>Or copy this link: <a href="${invitationUrl}">${invitationUrl}</a></p>
            <p>Happy playing! 🎵</p>
          </div>
          <div class="footer">
            <p>This link expires in 30 days.</p>
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
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
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
            <p>Click the link below to accept the invitation. You'll be guided to create your account and join the game:</p>
            <a href="${invitationUrl}" class="button">Accept Invitation & Create Account</a>
            <p>Or copy this link: <a href="${invitationUrl}">${invitationUrl}</a></p>
            <p>Questions? Reply to this email!</p>
            <p>Let's play! 🎵</p>
          </div>
          <div class="footer">
            <p>This link expires in 30 days.</p>
            <p>You were invited as: <strong>${invitedEmail}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

---

## Recomendación

| Scenario | Opción |
|----------|--------|
| **Desarrollo/Pruebas** | ✅ Mock (Opción A) |
| **Producción** | ✅ Resend (Opción B) |

Para ahora, te recomiendo **Opción A** (Mock) para que puedas probar todo inmediatamente sin problemas de permisos.

Después, cuando quieras emails reales, cambias a **Resend** que es muy fácil y gratuito.
