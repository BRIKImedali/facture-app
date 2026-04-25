-- ==============================================================================
-- MIGRATION SCRIPT: v1 to v2
-- Description: Migrates existing data to support new features:
--              - RBAC & ID-Based Login
--              - Stock Management & Unites
--              - Client Categories
--              - Payment Methods
-- Note: Make sure to back up your database before running this script.
--       If using hibernate.ddl-auto=update, run this AFTER spring boot has created the new tables.
-- ==============================================================================

-- 1. USERS & RBAC MIGRATION
-- ------------------------------------------------------------------------------
-- Move email to username if username is empty or missing (assuming hibernate created the column)
UPDATE users SET username = email WHERE username IS NULL OR username = '';

-- Set all existing users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- If email column exists and you want to clean up, you would drop it. 
-- BUT we leave it commented out for safety:
-- ALTER TABLE users DROP COLUMN email;

-- Insert default System Roles if not already created by AdminDataInitializer
INSERT INTO app_roles (name, description, is_system_role, created_at, updated_at)
SELECT 'SUPER_ADMIN', 'Administrateur système avec accès total', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM app_roles WHERE name = 'SUPER_ADMIN');

-- Assign all existing ADMIN users the SUPER_ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, app_roles r
WHERE u.role = 'ADMIN' AND r.name = 'SUPER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);


-- 2. PRODUITS, STOCK & UNITÉS MIGRATION
-- ------------------------------------------------------------------------------
-- Create default unit "UNITE" if the table exists
INSERT INTO unites (code, description)
SELECT 'U', 'Unité standard'
WHERE NOT EXISTS (SELECT 1 FROM unites WHERE code = 'U');

-- Move existing string units to the new Unites table if they don't exist
INSERT INTO unites (code, description)
SELECT DISTINCT unite, unite FROM produits 
WHERE unite IS NOT NULL AND unite != ''
AND NOT EXISTS (SELECT 1 FROM unites u WHERE u.code = produits.unite);

-- Update products to link to the new unite_id
-- Note: this assumes Hibernate created a unite_id column and the old column was renamed or kept as 'unite'
-- If hibernate dropped 'unite' before migration, this step requires manual intervention prior to boot.
-- Example if old column is still there:
-- UPDATE produits p SET unite_id = (SELECT id FROM unites u WHERE u.code = p.unite) WHERE p.unite_id IS NULL;

-- Initialize default stock values
UPDATE produits SET stock_quantite = 0 WHERE stock_quantite IS NULL;
UPDATE produits SET stock_minimum = 0 WHERE stock_minimum IS NULL;


-- 3. CLIENT CATEGORIES MIGRATION
-- ------------------------------------------------------------------------------
-- Create default category
INSERT INTO client_categories (code, description)
SELECT 'STANDARD', 'Client Standard'
WHERE NOT EXISTS (SELECT 1 FROM client_categories WHERE code = 'STANDARD');

-- Link existing clients to standard category (Optional)
UPDATE clients SET category_code = 'STANDARD' WHERE category_code IS NULL;


-- 4. FACTURES MIGRATION
-- ------------------------------------------------------------------------------
-- Set default payment method to 'VIREMENT' for validated/paid factures if null
UPDATE factures 
SET payment_method = 'VIREMENT' 
WHERE statut IN ('VALIDEE', 'PAYEE') AND payment_method IS NULL;

-- Set others to ESPÈCES or leave NULL
-- UPDATE factures SET payment_method = 'ESPECES' WHERE payment_method IS NULL;
