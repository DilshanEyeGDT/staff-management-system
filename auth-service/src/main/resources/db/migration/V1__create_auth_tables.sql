-- Roles table
CREATE TABLE roles (
                       id SERIAL PRIMARY KEY,
                       name VARCHAR(50) UNIQUE NOT NULL,
                       description TEXT,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       cognito_sub VARCHAR(255) UNIQUE NOT NULL,
                       username VARCHAR(100) UNIQUE,
                       email VARCHAR(255) NOT NULL,
                       display_name VARCHAR(255),
                       status VARCHAR(20) DEFAULT 'ACTIVE',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       last_login TIMESTAMP
);

-- User-Roles junction table
CREATE TABLE user_roles (
                            user_id INT REFERENCES users(id) ON DELETE CASCADE,
                            role_id INT REFERENCES roles(id) ON DELETE CASCADE,
                            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY(user_id, role_id)
);

-- Audit log table
CREATE TABLE audit_log (
                           id SERIAL PRIMARY KEY,
                           user_id INT REFERENCES users(id) ON DELETE SET NULL,
                           event_type VARCHAR(50) NOT NULL,
                           event_desc TEXT,
                           ip_address VARCHAR(100),
                           user_agent TEXT,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);