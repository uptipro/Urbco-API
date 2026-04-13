import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
    name = 'InitSchema1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ------------------------------------------------------------------
        // roles
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id"          UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"        CHARACTER VARYING,
                "permissions" TEXT,
                "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // permissions
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "permissions" (
                "id"        UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"      CHARACTER VARYING,
                "code"      CHARACTER VARYING,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // users  (FK → roles)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id"          UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "first_name"  CHARACTER VARYING,
                "last_name"   CHARACTER VARYING,
                "email"       CHARACTER VARYING        NOT NULL,
                "mobile"      CHARACTER VARYING        NOT NULL,
                "password"    CHARACTER VARYING        NOT NULL,
                "status"      CHARACTER VARYING        NOT NULL DEFAULT 'active',
                "user_type"   CHARACTER VARYING        NOT NULL DEFAULT 'admin',
                "verified"    BOOLEAN                  NOT NULL DEFAULT false,
                "role_id"     UUID,
                "last_login"  TIMESTAMP WITH TIME ZONE,
                "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_users_role_id"
                    FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL
            )
        `);

        // ------------------------------------------------------------------
        // otps
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "otps" (
                "id"         UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "email"      CHARACTER VARYING        NOT NULL,
                "code"       CHARACTER VARYING        NOT NULL,
                "expires_in" TIMESTAMP WITH TIME ZONE NOT NULL,
                "token"      CHARACTER VARYING        NOT NULL,
                "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_otps_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // investors
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "investors" (
                "id"                   UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "title"                CHARACTER VARYING,
                "user_type"            CHARACTER VARYING        NOT NULL,
                "first_name"           CHARACTER VARYING,
                "last_name"            CHARACTER VARYING,
                "phone"                CHARACTER VARYING,
                "email"                CHARACTER VARYING,
                "date_of_birth"        TIMESTAMP WITH TIME ZONE,
                "marital_status"       CHARACTER VARYING,
                "gender"               CHARACTER VARYING,
                "address"              CHARACTER VARYING,
                "business_name"        CHARACTER VARYING,
                "business_reg_no"      CHARACTER VARYING,
                "business_address"     CHARACTER VARYING,
                "date_of_incoporation" TIMESTAMP WITH TIME ZONE,
                "business_country"     CHARACTER VARYING,
                "business_email"       CHARACTER VARYING,
                "business_phone"       CHARACTER VARYING,
                "password"             CHARACTER VARYING        NOT NULL,
                "createdAt"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_investors_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // property_types  (FK → users)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "property_types" (
                "id"                  UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"                CHARACTER VARYING,
                "status"              CHARACTER VARYING        NOT NULL DEFAULT 'active',
                "last_updated_by_id"  UUID,
                "createdAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_property_types_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_property_types_last_updated_by"
                    FOREIGN KEY ("last_updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL
            )
        `);

        // ------------------------------------------------------------------
        // features  (FK → users)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "features" (
                "id"                 UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"               CHARACTER VARYING,
                "description"        CHARACTER VARYING,
                "image"              CHARACTER VARYING,
                "status"             CHARACTER VARYING        NOT NULL DEFAULT 'active',
                "last_updated_by_id" UUID,
                "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_features_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_features_last_updated_by"
                    FOREIGN KEY ("last_updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL
            )
        `);

        // ------------------------------------------------------------------
        // settings
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "settings" (
                "id"                 UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "quote"              CHARACTER VARYING,
                "quoteArthur"        CHARACTER VARYING,
                "investment_insight" CHARACTER VARYING,
                "testimonials"       JSONB,
                "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_settings_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // requests
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "requests" (
                "id"        UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"      CHARACTER VARYING,
                "phone"     CHARACTER VARYING,
                "email"     CHARACTER VARYING,
                "message"   CHARACTER VARYING,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_requests_id" PRIMARY KEY ("id")
            )
        `);

        // ------------------------------------------------------------------
        // properties  (FK → users, property_types)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "properties" (
                "id"                         UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "name"                       CHARACTER VARYING        NOT NULL,
                "created_by_id"              UUID,
                "last_updated_by_id"         UUID,
                "ref"                        CHARACTER VARYING        NOT NULL,
                "images"                     JSONB,
                "investors_count"            INTEGER                  NOT NULL DEFAULT 0,
                "total_units"                INTEGER                  NOT NULL,
                "total_fractions"            INTEGER                  NOT NULL,
                "investment_available"       DOUBLE PRECISION         NOT NULL,
                "total_price"                DOUBLE PRECISION         NOT NULL,
                "cost_per_unit"              DOUBLE PRECISION         NOT NULL,
                "cost_per_fraction"          DOUBLE PRECISION         NOT NULL,
                "fractions_taken"            INTEGER                  NOT NULL DEFAULT 0,
                "discount_claimed"           INTEGER                           DEFAULT 0,
                "total_discount_claimed"     DOUBLE PRECISION,
                "features"                   JSONB,
                "details"                    JSONB,
                "areaSqm"                    DOUBLE PRECISION,
                "type_id"                    UUID,
                "short_description"          CHARACTER VARYING        NOT NULL,
                "description"                TEXT                     NOT NULL,
                "status"                     CHARACTER VARYING        NOT NULL DEFAULT 'design',
                "address"                    CHARACTER VARYING,
                "city"                       CHARACTER VARYING,
                "state"                      CHARACTER VARYING,
                "country"                    CHARACTER VARYING        NOT NULL DEFAULT 'nigeria',
                "construction_start_date"    TIMESTAMP WITH TIME ZONE,
                "construction_end_date"      TIMESTAMP WITH TIME ZONE,
                "roofing_date"               TIMESTAMP WITH TIME ZONE,
                "rentals"                    JSONB,
                "capital_appreciation_percent" DOUBLE PRECISION,
                "csp"                        JSONB,
                "opbp"                       JSONB,
                "optp"                       JSONB,
                "sent_to_buyops"             BOOLEAN                  NOT NULL DEFAULT false,
                "buyops_asset_id"            CHARACTER VARYING,
                "createdAt"                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_properties_id"    PRIMARY KEY ("id"),
                CONSTRAINT "UQ_properties_ref"   UNIQUE ("ref"),
                CONSTRAINT "FK_properties_created_by"
                    FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_properties_last_updated_by"
                    FOREIGN KEY ("last_updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_properties_type"
                    FOREIGN KEY ("type_id") REFERENCES "property_types" ("id") ON DELETE SET NULL
            )
        `);

        // ------------------------------------------------------------------
        // payments  (FK → investors, properties)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payments" (
                "id"               UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "investor_id"      UUID,
                "property_id"      UUID,
                "amount"           DOUBLE PRECISION         NOT NULL,
                "transaction_ref"  CHARACTER VARYING        NOT NULL,
                "status"           CHARACTER VARYING        NOT NULL DEFAULT 'pending',
                "narration"        CHARACTER VARYING,
                "currency"         CHARACTER VARYING        NOT NULL DEFAULT 'naira',
                "transaction_date" TIMESTAMP WITH TIME ZONE,
                "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_payments_investor"
                    FOREIGN KEY ("investor_id") REFERENCES "investors" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_payments_property"
                    FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE SET NULL
            )
        `);

        // ------------------------------------------------------------------
        // investments  (FK → properties, investors, users)
        // ------------------------------------------------------------------
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "investments" (
                "id"                 UUID                     NOT NULL DEFAULT gen_random_uuid(),
                "property_id"        UUID,
                "investor_id"        UUID,
                "payment_breakdowns" JSONB,
                "created_by_id"      UUID,
                "amount_paid"        DOUBLE PRECISION,
                "total_amount"       DOUBLE PRECISION,
                "fractions_bought"   INTEGER,
                "payment_plan"       CHARACTER VARYING,
                "payment_status"     CHARACTER VARYING        NOT NULL DEFAULT 'pending',
                "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_investments_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_investments_property"
                    FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_investments_investor"
                    FOREIGN KEY ("investor_id") REFERENCES "investors" ("id") ON DELETE SET NULL,
                CONSTRAINT "FK_investments_created_by"
                    FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "investments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "requests"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "features"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "property_types"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "investors"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "otps"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    }
}
