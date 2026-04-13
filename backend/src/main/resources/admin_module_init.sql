-- ================================================================
-- Script SQL complet — Module d'Administration Système
-- Compatible PostgreSQL
-- À exécuter sur la base facturation_db
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE database_profiles — Profils de connexion BDD
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS database_profiles (
    id              BIGSERIAL PRIMARY KEY,
    profile_name    VARCHAR(100) UNIQUE NOT NULL,
    db_type         VARCHAR(20)  NOT NULL CHECK (db_type IN ('POSTGRESQL','MYSQL','ORACLE','SQLSERVER')),
    host            VARCHAR(255) NOT NULL,
    port            INTEGER      NOT NULL CHECK (port > 0 AND port <= 65535),
    database_name   VARCHAR(100) NOT NULL,
    username        VARCHAR(100) NOT NULL,
    password_encrypted TEXT,
    is_active       BOOLEAN DEFAULT FALSE,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100)
);

-- Contrainte : un seul profil actif à la fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_profile
    ON database_profiles (is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------
-- 2. TABLE erp_configs — Configurations ERP
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp_configs (
    id                      BIGSERIAL PRIMARY KEY,
    erp_type                VARCHAR(20)  NOT NULL CHECK (erp_type IN ('ODOO','SAP','SAGE','DYNAMICS','CUSTOM')),
    display_name            VARCHAR(100),
    api_url                 VARCHAR(500),
    auth_type               VARCHAR(20)  CHECK (auth_type IN ('API_KEY','OAUTH','BASIC_AUTH')),
    api_key_encrypted       TEXT,
    username                VARCHAR(100),
    password_encrypted      TEXT,
    oauth_token_encrypted   TEXT,
    is_active               BOOLEAN DEFAULT FALSE,
    sync_interval_minutes   INTEGER DEFAULT 60,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 3. TABLE erp_sync_settings — Paramètres de synchronisation
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp_sync_settings (
    id              BIGSERIAL PRIMARY KEY,
    erp_config_id   BIGINT NOT NULL REFERENCES erp_configs(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) CHECK (entity_type IN ('CLIENT','PRODUIT','FACTURE')),
    sync_enabled    BOOLEAN DEFAULT TRUE,
    sync_direction  VARCHAR(20) CHECK (sync_direction IN ('ERP_TO_APP','APP_TO_ERP','BIDIRECTIONAL')),
    last_sync       TIMESTAMP
);

-- ----------------------------------------------------------------
-- 4. TABLE erp_field_mappings — Mappings de champs ERP/App
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp_field_mappings (
    id              BIGSERIAL PRIMARY KEY,
    erp_config_id   BIGINT NOT NULL REFERENCES erp_configs(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50),
    erp_field       VARCHAR(100),
    app_field       VARCHAR(100),
    transformation  VARCHAR(50)
);

-- ----------------------------------------------------------------
-- 5. TABLE erp_sync_history — Historique des synchronisations
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp_sync_history (
    id                  BIGSERIAL PRIMARY KEY,
    erp_config_id       BIGINT REFERENCES erp_configs(id) ON DELETE SET NULL,
    sync_date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entity_type         VARCHAR(50),
    status              VARCHAR(20) CHECK (status IN ('SUCCESS','PARTIAL_SUCCESS','FAILED','IN_PROGRESS')),
    records_imported    INTEGER DEFAULT 0,
    records_exported    INTEGER DEFAULT 0,
    errors              TEXT,
    duration_ms         BIGINT,
    info_message        VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_sync_history_config ON erp_sync_history(erp_config_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_date   ON erp_sync_history(sync_date DESC);

-- ----------------------------------------------------------------
-- 6. TABLE permissions — Permissions granulaires
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id          BIGSERIAL PRIMARY KEY,
    entity      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    UNIQUE (entity, action)
);

-- ----------------------------------------------------------------
-- 7. TABLE app_roles — Rôles applicatifs personnalisables
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     VARCHAR(255),
    is_system_role  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 8. TABLE role_permissions — Association Rôles ↔ Permissions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ----------------------------------------------------------------
-- 9. TABLE user_roles — Association Utilisateurs ↔ AppRoles
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ----------------------------------------------------------------
-- 10. TABLE audit_logs — Logs d'audit complets
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT,
    user_email  VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    old_value   TEXT,
    new_value   TEXT,
    ip_address  VARCHAR(50),
    description VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

-- ----------------------------------------------------------------
-- 11. Mise à jour TABLE users — Ajout colonnes admin
-- ----------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active  BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login  TIMESTAMP;

-- ================================================================
-- DONNÉES PAR DÉFAUT
-- ================================================================

-- ----------------------------------------------------------------
-- Permissions (24 permissions)
-- ----------------------------------------------------------------
INSERT INTO permissions (entity, action, description) VALUES
    ('FACTURE',  'CREATE',  'Créer des factures'),
    ('FACTURE',  'READ',    'Voir les factures'),
    ('FACTURE',  'UPDATE',  'Modifier des factures'),
    ('FACTURE',  'DELETE',  'Supprimer des factures'),
    ('FACTURE',  'EXPORT',  'Exporter des factures en PDF/Excel'),
    ('FACTURE',  'APPROVE', 'Approuver des factures'),
    ('CLIENT',   'CREATE',  'Créer des clients'),
    ('CLIENT',   'READ',    'Voir les clients'),
    ('CLIENT',   'UPDATE',  'Modifier des clients'),
    ('CLIENT',   'DELETE',  'Supprimer des clients'),
    ('PRODUIT',  'CREATE',  'Créer des produits'),
    ('PRODUIT',  'READ',    'Voir les produits'),
    ('PRODUIT',  'UPDATE',  'Modifier des produits'),
    ('PRODUIT',  'DELETE',  'Supprimer des produits'),
    ('USER',     'CREATE',  'Créer des utilisateurs'),
    ('USER',     'READ',    'Voir les utilisateurs'),
    ('USER',     'UPDATE',  'Modifier des utilisateurs'),
    ('USER',     'DELETE',  'Supprimer des utilisateurs'),
    ('ROLE',     'CREATE',  'Créer des rôles'),
    ('ROLE',     'READ',    'Voir les rôles'),
    ('ROLE',     'UPDATE',  'Modifier des rôles'),
    ('ROLE',     'DELETE',  'Supprimer des rôles'),
    ('SYSTEM',   'CONFIG',  'Configurer le système'),
    ('SYSTEM',   'AUDIT',   'Voir les logs d''audit')
ON CONFLICT (entity, action) DO NOTHING;

-- ----------------------------------------------------------------
-- Rôle SUPER_ADMIN (toutes les permissions, non modifiable)
-- ----------------------------------------------------------------
INSERT INTO app_roles (name, description, is_system_role) VALUES
    ('SUPER_ADMIN', 'Super Administrateur — accès total non modifiable', TRUE),
    ('ADMIN',       'Administrateur — accès complet', TRUE),
    ('MANAGER',     'Manager — gestion factures/clients/produits', TRUE),
    ('USER',        'Utilisateur standard — lecture + création factures', TRUE),
    ('VIEWER',      'Lecteur — accès en lecture seule', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Assigner toutes les permissions à SUPER_ADMIN et ADMIN
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM app_roles r, permissions p
    WHERE r.name IN ('SUPER_ADMIN', 'ADMIN')
ON CONFLICT DO NOTHING;

-- Assigner CRUD factures/clients/produits à MANAGER
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM app_roles r, permissions p
    WHERE r.name = 'MANAGER'
      AND p.entity IN ('FACTURE', 'CLIENT', 'PRODUIT')
ON CONFLICT DO NOTHING;

-- Assigner READ + FACTURE:CREATE à USER
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM app_roles r, permissions p
    WHERE r.name = 'USER'
      AND (p.action = 'READ' OR (p.entity = 'FACTURE' AND p.action = 'CREATE'))
ON CONFLICT DO NOTHING;

-- Assigner READ only à VIEWER
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM app_roles r, permissions p
    WHERE r.name = 'VIEWER'
      AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- ================================================================
-- MESSAGE DE CONFIRMATION
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Module Admin initialisé : % permissions, % rôles créés',
        (SELECT COUNT(*) FROM permissions),
        (SELECT COUNT(*) FROM app_roles);
END $$;
