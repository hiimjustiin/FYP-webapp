/**
 * Migration: Add email verification OTP table
 * Creates a table to store one-time passwords for email verification
 */

export async function up(pgm) {
  // Create email_verification_otps table
  pgm.createTable('email_verification_otps', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'text',
      notNull: true,
    },
    otp_code: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    verified_at: {
      type: 'timestamptz',
      notNull: false,
    },
    attempts: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create indexes for performance
  pgm.createIndex('email_verification_otps', 'email');
  pgm.createIndex('email_verification_otps', 'otp_code');
  pgm.createIndex('email_verification_otps', ['email', 'otp_code']);
  pgm.createIndex('email_verification_otps', 'expires_at');

  // Add comment
  pgm.sql(`
    COMMENT ON TABLE email_verification_otps IS 'Stores OTP codes for email verification during registration';
  `);
}

export async function down(pgm) {
  // Drop indexes
  pgm.dropIndex('email_verification_otps', 'expires_at');
  pgm.dropIndex('email_verification_otps', ['email', 'otp_code']);
  pgm.dropIndex('email_verification_otps', 'otp_code');
  pgm.dropIndex('email_verification_otps', 'email');

  // Drop table
  pgm.dropTable('email_verification_otps');
}
