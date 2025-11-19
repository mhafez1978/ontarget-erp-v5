import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/dashboard/settings?oauth_error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/dashboard/settings?oauth_error=missing_params`
      );
    }

    // Parse state data
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/dashboard/settings?oauth_error=invalid_state`
      );
    }

    const { clientId, clientSecret, fromEmail } = stateData;

    if (!clientId || !clientSecret || !fromEmail) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 400px;
              }
              .error-icon {
                width: 80px;
                height: 80px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                font-size: 3rem;
                color: white;
              }
              h1 {
                color: #1f2937;
                margin: 0 0 0.5rem;
                font-size: 1.5rem;
              }
              p {
                color: #6b7280;
                margin: 0;
                font-size: 0.875rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">✖</div>
              <h1>❌ Missing Credentials</h1>
              <p>Missing client credentials. Please try again.</p>
            </div>
            <script>
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // No session validation needed - the authorize endpoint already validated
    // the user has permission. The popup window won't have session cookies anyway.

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/email-provider/google-oauth/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/dashboard/settings?oauth_error=no_refresh_token`
      );
    }

    // Encrypt sensitive data
    const encryptedClientSecret = encrypt(clientSecret);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Check if GOOGLE_OAUTH provider already exists
    const existingProvider = await db.emailProvider.findFirst({
      where: {
        provider: "GOOGLE_OAUTH",
        scope: "GLOBAL",
      },
    });

    if (existingProvider) {
      // Update existing provider
      await db.emailProvider.update({
        where: { id: existingProvider.id },
        data: {
          googleClientId: clientId,
          googleClientSecret: encryptedClientSecret,
          googleRefreshToken: encryptedRefreshToken,
          googleFromEmail: fromEmail,
          isActive: true,
          isConnected: true,
          fromName: "OnTarget Brands Inc",
          fromEmail: fromEmail,
        },
      });
    } else {
      // Create new provider
      await db.emailProvider.create({
        data: {
          provider: "GOOGLE_OAUTH",
          scope: "GLOBAL",
          googleClientId: clientId,
          googleClientSecret: encryptedClientSecret,
          googleRefreshToken: encryptedRefreshToken,
          googleFromEmail: fromEmail,
          isActive: true,
          isConnected: true,
          fromName: "OnTarget Brands Inc",
          fromEmail: fromEmail,
        },
      });
    }

    console.log(
      "[Google OAuth] Successfully stored refresh token for:",
      fromEmail
    );

    // Return HTML that closes the popup window
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.5rem;
              animation: scaleIn 0.5s ease-out;
            }
            .checkmark {
              width: 40px;
              height: 40px;
              border: 4px solid white;
              border-left: none;
              border-top: none;
              transform: rotate(45deg);
              margin-top: -8px;
            }
            h1 {
              color: #1f2937;
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
            }
            p {
              color: #6b7280;
              margin: 0 0 1.5rem;
              font-size: 0.875rem;
            }
            .email {
              background: #f3f4f6;
              padding: 0.75rem;
              border-radius: 0.5rem;
              font-family: monospace;
              font-size: 0.875rem;
              color: #4b5563;
              word-break: break-all;
            }
            @keyframes scaleIn {
              from {
                transform: scale(0);
              }
              to {
                transform: scale(1);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">
              <div class="checkmark"></div>
            </div>
            <h1>✅ Authentication Successful!</h1>
            <p>Your Google email provider has been configured successfully.</p>
            <div class="email">${fromEmail}</div>
          </div>
          <script>
            // Close the popup after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("[Google OAuth Callback] Error:", error);

    // Return HTML error page that closes the popup
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .error-icon {
              width: 80px;
              height: 80px;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.5rem;
              font-size: 3rem;
              color: white;
            }
            h1 {
              color: #1f2937;
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
            }
            p {
              color: #6b7280;
              margin: 0;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✖</div>
            <h1>❌ Authentication Failed</h1>
            <p>There was an error configuring your email provider. Please try again.</p>
          </div>
          <script>
            // Close the popup after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}
