-- Check current database state
-- Run this to see what we have

-- Companies
SELECT id, name, country, countryCode FROM Company LIMIT 5;

-- Staff members
SELECT 
  cs.id,
  u.email,
  u.name,
  cs.jobTitle,
  cs.employmentType,
  cs.country,
  cs.countryCode,
  cs.status
FROM CompanyStaff cs
JOIN User u ON cs.userId = u.id
LIMIT 10;

-- Time entries (to see if people are clocking in)
SELECT 
  te.id,
  cs.id as staffId,
  u.email,
  te.clockIn,
  te.clockOut,
  te.totalHours,
  te.status,
  te.isApproved
FROM TimeEntry te
JOIN CompanyStaff cs ON te.staffId = cs.id
JOIN User u ON cs.userId = u.id
ORDER BY te.clockIn DESC
LIMIT 10;

-- Existing payroll entries
SELECT COUNT(*) as payroll_count FROM PayrollEntry;
