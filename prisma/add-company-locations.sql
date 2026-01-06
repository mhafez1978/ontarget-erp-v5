-- Add fictitious locations for companies with NULL coordinates

-- Add locations for OnTarget Brands (root company)
INSERT INTO CompanyLocation (id, companyId, name, type, isMain, addressLine1, addressLine2, city, state, country, postalCode, latitude, longitude, createdAt, updatedAt)
VALUES
  ('loc_root_hq', 'cmiwdyr850002xozo0a5ldsi1', 'OnTarget ERP - Headquarters', 'HEADQUARTERS', true, '100 Innovation Drive', 'Suite 200', 'San Francisco', 'CA', 'USA', '94105', 37.7749, -122.4194, NOW(), NOW()),
  ('loc_root_nyc', 'cmiwdyr850002xozo0a5ldsi1', 'OnTarget ERP - NYC Office', 'OFFICE', false, '500 5th Avenue', 'Suite 1500', 'New York', 'NY', 'USA', '10110', 40.7580, -73.9855, NOW(), NOW()),
  ('loc_root_london', 'cmiwdyr850002xozo0a5ldsi1', 'OnTarget ERP - London Office', 'OFFICE', false, '30 St Mary Axe', '', 'London', 'England', 'UK', 'EC3A 8EP', 51.5045, -0.0865, NOW(), NOW());

-- Add locations for MOVE Web Design
INSERT INTO CompanyLocation (id, companyId, name, type, isMain, addressLine1, addressLine2, city, state, country, postalCode, latitude, longitude, createdAt, updatedAt)
VALUES
  ('loc_move_hq', 'cmjdb0qq4002fxourj21h11fu', 'MOVE Web Design - Los Angeles', 'HEADQUARTERS', true, '1234 Sunset Boulevard', 'Suite 300', 'Los Angeles', 'CA', 'USA', '90028', 34.1030, -118.2642, NOW(), NOW()),
  ('loc_move_sf', 'cmjdb0qq4002fxourj21h11fu', 'MOVE Web Design - San Francisco', 'OFFICE', false, '555 Market Street', 'Suite 200', 'San Francisco', 'CA', 'USA', '94105', 37.7899, -122.3971, NOW(), NOW());

-- Verify locations were added
SELECT COUNT(*) as total_locations FROM CompanyLocation;
SELECT id, companyId, name, city, latitude, longitude FROM CompanyLocation ORDER BY companyId;
