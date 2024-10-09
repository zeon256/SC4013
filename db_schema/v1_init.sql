-- Create User table
CREATE TABLE "User"
(
    id                         SERIAL PRIMARY KEY,
    email                      VARCHAR(100)  NOT NULL,
    password                   VARCHAR(1000) NOT NULL,
    salt                       VARCHAR(32)   NOT NULL,
    last_password_change       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login                 TIMESTAMPTZ,
    failed_login_attempt_count INT           NOT NULL DEFAULT 0,
    lockout                    BOOLEAN       NOT NULL DEFAULT FALSE,
    is_admin                   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at                 TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at                 TIMESTAMPTZ   NULL     DEFAULT NULL
);

-- Create Product table
CREATE TABLE Product
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    created_by  INT          REFERENCES "User" (ID) ON DELETE SET NULL,
    updated_by  INT          REFERENCES "User" (ID) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ  NULL     DEFAULT NULL
);
