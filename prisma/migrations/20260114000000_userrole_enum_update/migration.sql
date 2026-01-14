-- Migration: userrole enum update
-- Adds new enum values, maps existing rows, then prunes old enum values

-- 1) Extend enum to include new values (keep legacy values while mapping)
ALTER TABLE `User`
MODIFY COLUMN `role` ENUM(
  'SUPER_ADMIN',
  'ADMIN',
  'ADMIN_OWNER',
  'ADMIN_NONOWNER',
  'MANAGER',
  'COMPANY_MANAGER',
  'STAFF',
  'COMPANY_STAFF',
  'CONTRACTOR',
  'COMPANY_CONTRACTOR',
  'SUPPLIER',
  'COMPANY_SUPPLIER',
  'ERP_CUSTOMER',
  'COMPANY_CUSTOMER'
) NOT NULL DEFAULT 'ERP_CUSTOMER';

-- 2) Map existing "ADMIN" users who are owners to ADMIN_OWNER
UPDATE `User` AS u
JOIN `Company` AS c ON c.ownerId = u.id
SET u.role = 'ADMIN_OWNER'
WHERE u.role = 'ADMIN';

-- 3) Map remaining ADMIN -> ADMIN_NONOWNER
UPDATE `User`
SET role = 'ADMIN_NONOWNER'
WHERE role = 'ADMIN';

-- 4) Map other legacy role names to new names
UPDATE `User` SET role = 'COMPANY_MANAGER' WHERE role = 'MANAGER';
UPDATE `User` SET role = 'COMPANY_STAFF' WHERE role = 'STAFF';
UPDATE `User` SET role = 'COMPANY_CONTRACTOR' WHERE role = 'CONTRACTOR';
UPDATE `User` SET role = 'COMPANY_SUPPLIER' WHERE role = 'SUPPLIER';

-- 5) (Optional) Prune legacy enum values by restricting the enum to new canonical set
ALTER TABLE `User`
MODIFY COLUMN `role` ENUM(
  'SUPER_ADMIN',
  'ADMIN_OWNER',
  'ADMIN_NONOWNER',
  'COMPANY_MANAGER',
  'COMPANY_STAFF',
  'ERP_CUSTOMER',
  'COMPANY_CUSTOMER',
  'COMPANY_CONTRACTOR',
  'COMPANY_SUPPLIER'
) NOT NULL DEFAULT 'ERP_CUSTOMER';

-- End migration
