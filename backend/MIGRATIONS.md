# Database Migrations Guide

## Overview

This project uses `node-pg-migrate` for database schema migrations. **Never edit `database/init/01-init.sql` for ongoing schema changes** — that file only runs once when the database is first initialized. Use migrations for all schema updates.

## Why Migrations Instead of Editing 01-init.sql?

- Docker Postgres runs init scripts (`/docker-entrypoint-initdb.d`) **only when the data volume is empty**
- Once the database exists, editing `01-init.sql` and restarting won't apply changes
- Migrations track schema versions and can be applied incrementally to existing databases
- Migrations work in production without destroying data

## Setup

### 1. Install Dependencies

```bash
cd backend
bun install
```

This installs `node-pg-migrate` as a dev dependency.

### 2. Environment Variables

Ensure `DATABASE_URL` is set in your environment:

**Local development (.env):**
```bash
DATABASE_URL=postgresql://ila_user:ila_secure_password_2025@localhost:5432/ila_db
```

**Production (.env.production on EC2):**
```bash
DATABASE_URL=postgresql://ila_user:JPBFpINsKQ4hQDrJYSDe@postgres:5432/ila_db
```

## Running Migrations

### Apply All Pending Migrations

```bash
cd backend
bun db:migrate
```

This runs all migrations in `backend/migrations/` that haven't been applied yet.

### Rollback Last Migration

```bash
bun db:migrate:down
```

### Create a New Migration

```bash
bun db:migrate:create add-new-column
```

This creates a new migration file in `backend/migrations/` with a timestamp prefix.

## Migration File Structure

Example migration (`1728270000000_enhance-projects-schema.js`):

```javascript
exports.up = (pgm) => {
  // Changes to apply (e.g., add column, create table)
  pgm.addColumn('projects', {
    course_id: {
      type: 'uuid',
      references: 'courses',
      onDelete: 'SET NULL'
    }
  });
};

exports.down = (pgm) => {
  // How to rollback (reverse the changes)
  pgm.dropColumn('projects', 'course_id');
};
```

## Current Migration: Enhance Projects Schema

**File:** `1728270000000_enhance-projects-schema.js`

**What it does:**
1. Adds `course_id` to `projects` table (FK to courses)
2. Adds `project_type` column ('individual' or 'group')
3. Adds `essay_text` column (for individual project text input)
4. Creates `project_files` table for file uploads
5. Adds indexes for performance

**Schema after migration:**

### `projects` table (enhanced)
- `id` - UUID primary key
- `title` - TEXT, project name
- `description` - TEXT
- `owner_id` - UUID, FK to users
- `course_id` - **NEW:** UUID, FK to courses (predefined dropdown)
- `project_type` - **NEW:** TEXT ('individual' or 'group')
- `essay_text` - **NEW:** TEXT (essay content for individual projects)
- `status` - TEXT
- `settings` - JSONB
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

### `project_files` table (new)
- `id` - UUID primary key
- `project_id` - UUID, FK to projects
- `file_name` - TEXT (original filename)
- `file_url` - TEXT (storage path/URL)
- `file_type` - TEXT (MIME type)
- `file_size` - INTEGER (bytes)
- `uploaded_by` - UUID, FK to users
- `created_at` - TIMESTAMPTZ

### `project_members` table (already exists)
- Used for group projects to track team members
- Links `project_id` to `user_id` with roles

## Project Workflow by Type

### Individual Project
1. User selects course from dropdown (`course_id`)
2. User enters project name (`title`)
3. User selects "Individual" (`project_type='individual'`)
4. User can either:
   - Enter essay text (`essay_text`)
   - OR upload a PDF file (creates entry in `project_files`)

### Group Project
1. User selects course from dropdown (`course_id`)
2. User enters project name (`title`)
3. User selects "Group" (`project_type='group'`)
4. User selects team members (creates entries in `project_members`)
5. User uploads file (creates entry in `project_files`)

## Running Migrations in Docker

### Local Development

```bash
# Start containers
docker compose up -d

# Run migrations inside backend container
docker compose exec backend bun db:migrate
```

### Production (EC2)

```bash
# SSH to EC2
ssh -i ila-pk.pem ec2-user@13.229.1.151
cd /home/ec2-user/ila-webapp

# Run migrations (ensure postgres is healthy first)
sudo docker compose exec backend bun db:migrate
```

Or run as a one-off command:

```bash
sudo docker compose run --rm backend bun db:migrate
```

## Adding Migrations to Deploy Pipeline

### Option 1: GitHub Actions

Add this step to `.github/workflows/deploy.yml` after starting containers:

```yaml
- name: Run Database Migrations
  run: |
    ssh -i ~/.ssh/id_rsa ${{ env.EC2_USER }}@${{ env.EC2_HOST }} << 'ENDSSH'
      cd ${{ env.DEPLOY_PATH }}
      echo "Running database migrations..."
      sudo docker compose exec -T backend bun db:migrate
    ENDSSH
```

### Option 2: Deploy Script

Add to your deploy script before starting the backend:

```bash
echo "Running database migrations..."
sudo docker compose run --rm backend bun db:migrate
```

## Best Practices

1. **Always test migrations locally first** before deploying to production
2. **Write both up and down migrations** (for rollback capability)
3. **Make migrations backwards-compatible** when possible:
   - Add nullable columns first, backfill data, then add NOT NULL constraint
   - Don't drop columns immediately; deprecate them first
4. **Use transactions** (node-pg-migrate does this by default for most operations)
5. **Keep migrations small and focused** (one logical change per migration)
6. **Never edit a migration after it's been applied** to production

## Troubleshooting

### Migration fails with "relation already exists"

The table/column might already exist. Check your database:

```bash
docker compose exec postgres psql -U ila_user -d ila_db -c "\d projects"
```

### Reset migrations (development only, destroys data)

```bash
# Stop containers
docker compose down

# Remove volume
docker volume rm ila-webapp_postgres_data

# Start fresh
docker compose up -d

# Wait for postgres to initialize, then run migrations
sleep 10
docker compose exec backend bun db:migrate
```

### Check migration status

```bash
docker compose exec postgres psql -U ila_user -d ila_db -c "SELECT * FROM pgmigrations ORDER BY run_on DESC;"
```

## Common Migration Operations

### Add a column

```javascript
exports.up = (pgm) => {
  pgm.addColumn('projects', {
    new_column: { type: 'text', notNull: false }
  });
};
```

### Create an index

```javascript
exports.up = (pgm) => {
  pgm.createIndex('projects', 'course_id');
};
```

### Add a foreign key

```javascript
exports.up = (pgm) => {
  pgm.addConstraint('projects', 'fk_project_course', {
    foreignKeys: {
      columns: 'course_id',
      references: 'courses(id)',
      onDelete: 'SET NULL'
    }
  });
};
```

### Alter column type

```javascript
exports.up = (pgm) => {
  pgm.alterColumn('projects', 'status', {
    type: 'text',
    using: 'status::text'  // How to cast existing values
  });
};
```

## PostgreSQL vs MySQL: Key Differences for Migrations

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| **Transactional DDL** | Yes (most DDL in transactions) | No (DDL causes implicit commit) |
| **ALTER TABLE** | Supports complex alterations | Limited alterations per statement |
| **Column defaults** | Can be added without table rewrite (11+) | Always rewrites table |
| **JSONB** | Native, indexed, queryable | JSON text type only |
| **Arrays** | Native array types | Must use TEXT or separate table |
| **UUIDs** | Native UUID type | Must use BINARY(16) or CHAR(36) |
| **Extensions** | CREATE EXTENSION (pgcrypto, etc.) | No extension system |
| **ENUM** | CREATE TYPE as enum | ENUM as column constraint |

## Need Help?

- Check [node-pg-migrate docs](https://salsita.github.io/node-pg-migrate/)
- Review existing migrations in `backend/migrations/`
- Run `bun db:migrate:create --help` for options
