import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const currentDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OnTarget ERP</title>
    <link>${baseUrl}</link>
    <description>Enterprise Resource Planning System - Manage your business operations efficiently</description>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
    <item>
      <title>Welcome to OnTarget ERP</title>
      <link>${baseUrl}</link>
      <description>OnTarget ERP is your complete business management solution for tracking operations, managing customers, and streamlining workflows.</description>
      <pubDate>${currentDate}</pubDate>
      <guid>${baseUrl}</guid>
    </item>
    
    <item>
      <title>Register for an Account</title>
      <link>${baseUrl}/register</link>
      <description>Sign up for OnTarget ERP to start managing your business operations with our powerful platform.</description>
      <pubDate>${currentDate}</pubDate>
      <guid>${baseUrl}/register</guid>
    </item>
    
    <item>
      <title>Login to Your Account</title>
      <link>${baseUrl}/login</link>
      <description>Access your OnTarget ERP dashboard to manage your business operations.</description>
      <pubDate>${currentDate}</pubDate>
      <guid>${baseUrl}/login</guid>
    </item>
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
