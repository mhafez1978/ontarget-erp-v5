# Security Lockdown Feature - Implementation Plan

**Date:** November 13, 2025  
**Feature Name:** Lockdown - Security Monitor System  
**Status:** In Development

---

## Overview

This feature implements a comprehensive security monitoring system to track failed login attempts, automatically block malicious IPs, and provide administrators with tools to monitor and manage security threats.

## Problem Statement

We need to:

- Track failed login attempts with geographic information
- Automatically lock out IPs after 6 consecutive failed attempts for 1 hour
- Maintain a blacklist of malicious IPs with full geo-location data
- Provide a dashboard for Super Admins to monitor security threats
- Log high-security events in the audit system

---

## Current System Assets

✅ **Geo-location API** (`/api/get-location`)

- Returns: ip, ipv4, ipv6, city, region, country, country_code, flag, latitude, longitude, timezone

✅ **Audit Log System**

- Already tracks user activities with severity levels

✅ **Form Error States**

- Login form has error handling

✅ **Session Tracking**

- Already captures geo data on successful logins

✅ **Role-Based Access Patterns**

- Established pattern for Super Admin, Admin, etc.

---

## Database Schema Changes

### New Models

#### 1. FailedLoginAttempt

Tracks every failed login attempt with full geo-location data.

```prisma
model FailedLoginAttempt {
  id                String   @id @default(cuid())
  email             String   // Email attempted (even if doesn't exist)
  ipAddress         String   // Primary IP
  ipv4              String?
  ipv6              String?
  city              String?
  state             String?
  country           String?
  countryCode       String?
  countryFlag       String?  // Flag emoji
  latitude          Float?
  longitude         Float?
  timezone          String?
  userAgent         String?  // Browser info
  attemptedAt       DateTime @default(now())

  // If user exists, link to them
  userId            String?
  user              User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([email])
  @@index([ipAddress])
  @@index([attemptedAt])
  @@index([userId])
}
```

#### 2. IpBlacklist

Maintains list of blocked IPs with auto-expiration and manual override capabilities.

```prisma
model IpBlacklist {
  id              String   @id @default(cuid())
  ipAddress       String   @unique
  ipv4            String?
  ipv6            String?
  city            String?
  state           String?
  country         String?
  countryCode     String?
  countryFlag     String?
  latitude        Float?
  longitude       Float?

  reason          String   // "Brute force", "Manual block", etc.
  failedAttempts  Int      @default(0)
  blockedAt       DateTime @default(now())
  blockedUntil    DateTime // Auto-unlock time (1 hour from block)

  // Who blocked it (if manual)
  blockedById     String?
  blockedBy       User?    @relation(fields: [blockedById], references: [id])

  isAutoBlocked   Boolean  @default(true) // Auto vs manual block
  isPermanent     Boolean  @default(false) // Permanent block

  @@index([ipAddress])
  @@index([blockedUntil])
}
```

#### 3. User Model Updates

```prisma
// Add to existing User model
failedLoginAttempts FailedLoginAttempt[]
blockedIps          IpBlacklist[]        @relation("BlockedBy")
```

---

## New API Endpoints

**IMPORTANT:** All new APIs - no modifications to existing endpoints!

### 1. `/api/security/check-ip` (GET)

- **Purpose:** Check if an IP is currently blocked
- **Used by:** New login wrapper API
- **Returns:** `{ blocked: boolean, blockedUntil: Date, reason: string }`

### 2. `/api/security/failed-attempts` (GET)

- **Purpose:** List all failed login attempts with pagination
- **Query params:** page, limit, email, ipAddress, startDate, endDate
- **Access:** Super Admin only
- **Returns:** Paginated list of failed attempts

### 3. `/api/security/failed-attempts` (POST)

- **Purpose:** Log a new failed login attempt
- **Used by:** New login wrapper API
- **Body:** email, ipAddress, geoData, userAgent
- **Logic:**
  - Creates FailedLoginAttempt record
  - Checks if IP has 6+ attempts in last hour
  - Auto-blocks IP if threshold reached
  - Creates audit log entry

### 4. `/api/security/blacklist` (GET)

- **Purpose:** List all blacklisted IPs
- **Query params:** page, limit, status (active/expired/permanent)
- **Access:** Super Admin only
- **Returns:** Paginated blacklist with stats

### 5. `/api/security/blacklist` (POST)

- **Purpose:** Manually block an IP
- **Access:** Super Admin only
- **Body:** ipAddress, reason, isPermanent, geoData
- **Creates:** IpBlacklist record + audit log

### 6. `/api/security/blacklist/[id]` (DELETE)

- **Purpose:** Unblock an IP (manual override)
- **Access:** Super Admin only
- **Creates:** Audit log entry

### 7. `/api/security/stats` (GET)

- **Purpose:** Dashboard statistics
- **Access:** Super Admin only
- **Returns:**
  - Failed attempts in last hour/24h/7d
  - Currently blocked IPs count
  - Top attacking countries
  - Most targeted emails

### 8. `/api/auth/login-secure` (POST)

- **Purpose:** New secure login endpoint (wraps existing logic)
- **Replaces:** Frontend will call this instead of `/api/auth/login`
- **Flow:**
  1. Check if IP is blacklisted
  2. If blocked, return error immediately
  3. Attempt login (call existing validation logic)
  4. If failed, log attempt and check threshold
  5. If success, clear recent failed attempts for IP

---

## Frontend Components

### 1. Dashboard Page: `/dashboard/security`

- **Route:** `/app/dashboard/security/page.tsx`
- **Access:** Super Admin only (will add Admin view later)
- **Layout:** Uses existing DashboardLayout pattern

### 2. Component: `SecurityMonitorView`

- **Path:** `/components/security-views/super-admin-security-view.tsx`
- **Sections:**
  - Real-time threats statistics cards
  - Failed login attempts table
  - IP blacklist table
  - Attack analytics charts (optional phase 2)

### 3. Component: `FailedAttemptsTable`

- Sortable, filterable table
- Color-coded by severity (1-3 yellow, 4-5 orange, 6+ red)
- Shows: Email, IP, Location (with flag), Time, Status

### 4. Component: `IpBlacklistTable`

- Action buttons: Unblock, Block Permanently, View Details
- Status badges: Active, Expired, Permanent
- Shows: IP, Location, Attempts, Blocked dates, Type

---

## Menu Integration

Add to Super Admin menu:

```typescript
{
  title: "Security Monitor",
  url: "/dashboard/security",
  icon: Shield, // from lucide-react
}
```

---

## Audit Log Events (New Types)

```typescript
enum AuditAction {
  // ... existing actions
  FAILED_LOGIN_ATTEMPT
  IP_AUTO_BLOCKED
  IP_MANUALLY_BLOCKED
  IP_UNBLOCKED
  SECURITY_THREAT_DETECTED
}
```

All security events logged with `severity: "HIGH"`

---

## Implementation Phases

### Phase 1: Core Security (Database & APIs)

1. ✅ Create README documentation
2. ⏳ Update Prisma schema
3. ⏳ Run migration
4. ⏳ Create security API endpoints
5. ⏳ Create login wrapper API
6. ⏳ Test blocking logic

### Phase 2: Dashboard MVP

1. ⏳ Create security page route
2. ⏳ Create SuperAdminSecurityView component
3. ⏳ Build failed attempts table
4. ⏳ Build blacklist table with actions
5. ⏳ Add to super admin menu

### Phase 3: Analytics & Visualization

1. Statistics cards
2. Charts (line, pie, bar)
3. Map visualization (using lat/lng)
4. Export functionality

### Phase 4: Advanced Features

1. Email notifications to admins
2. Admin view (scoped to their companies)
3. Whitelist feature
4. Advanced filtering and reporting

---

## Security Considerations

1. **Rate Limiting:** IP check API should be extremely fast (indexed queries)
2. **Auto-Cleanup:** Consider cron job to clear old failed attempts (>30 days)
3. **False Positives:** Provide easy unblock mechanism for legitimate users
4. **Privacy:** Store only necessary geo data, comply with regulations
5. **Performance:** All queries use proper indexes

---

## Testing Checklist

- [ ] Failed login creates attempt record
- [ ] 6th failed attempt auto-blocks IP
- [ ] Blocked IP cannot login
- [ ] 1-hour auto-unblock works
- [ ] Manual block works
- [ ] Manual unblock works
- [ ] Permanent block prevents auto-unblock
- [ ] Successful login clears failed attempts
- [ ] Audit logs created for all security events
- [ ] Super Admin can view all data
- [ ] Non-super-admin cannot access security endpoints

---

## Future Enhancements

- Multi-factor authentication (MFA)
- CAPTCHA after 3 failed attempts
- Suspicious login alerts (new device, new location)
- IP reputation scoring
- Integration with threat intelligence feeds
- Machine learning for anomaly detection

---

## Notes

- **Zero Breaking Changes:** All new APIs, no modifications to existing endpoints
- **Existing Login Still Works:** Old `/api/auth/login` untouched
- **Frontend Migration:** Frontend will gradually move to new secure endpoint
- **Backward Compatible:** System works with or without frontend changes

---

## References

- Existing geo API: `/app/api/get-location/route.ts`
- Existing login API: `/app/api/auth/login/route.ts` (reference only, not modified)
- Existing audit system: `/app/api/audit-logs/`
- Prisma schema: `/prisma/schema.prisma`

---

**Last Updated:** November 13, 2025  
**Next Review:** After Phase 1 completion
