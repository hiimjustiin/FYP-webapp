# Database Migrations Quick Reference

## Install & Setup

```bash
cd backend
pnpm install  # Installs node-pg-migrate
```

## Common Commands

```bash
# Apply all pending migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:down

# Create new migration
pnpm db:migrate:create my-migration-name
```

## Schema Changes for Project Feature

### New Columns in `projects` Table

```sql
course_id      UUID          -- FK to courses (dropdown selection)
project_type   TEXT          -- 'individual' or 'group'
essay_text     TEXT          -- Essay content (individual projects)
```

### New `project_files` Table

```sql
id             UUID PRIMARY KEY
project_id     UUID          -- FK to projects
file_name      TEXT          -- Original filename
file_url       TEXT          -- Storage location
file_type      TEXT          -- MIME type (e.g., 'application/pdf')
file_size      INTEGER       -- Bytes
uploaded_by    UUID          -- FK to users
created_at     TIMESTAMPTZ
```

### Existing `project_members` Table
Already exists, used for group project team members.

## Project Workflow

### Individual Project
1. Select course → `course_id`
2. Enter project name → `title`
3. Select "Individual" → `project_type='individual'`
4. Option A: Enter essay text → `essay_text`
5. Option B: Upload PDF → creates row in `project_files`

### Group Project
1. Select course → `course_id`
2. Enter project name → `title`
3. Select "Group" → `project_type='group'`
4. Select team members → creates rows in `project_members`
5. Upload file → creates row in `project_files`

## Run Migrations in Docker

```bash
# Local
docker compose exec backend pnpm db:migrate

# Production (EC2)
ssh -i ila-pk.pem ec2-user@13.229.1.151
cd /home/ec2-user/ila-webapp
sudo docker compose exec backend pnpm db:migrate
```

## Check Migration Status

```bash
docker compose exec postgres psql -U ila_user -d ila_db \
  -c "SELECT * FROM pgmigrations ORDER BY run_on DESC;"
```

## Example: Create Custom Migration

```bash
# Create migration file
pnpm db:migrate:create add-project-deadline

# Edit the generated file in backend/migrations/
# Add your up/down logic

# Apply migration
pnpm db:migrate
```

## PostgreSQL vs MySQL Key Differences

- **Transactional DDL**: Postgres wraps DDL in transactions, MySQL doesn't
- **JSONB**: Postgres has native indexed JSON, MySQL has text-only JSON
- **Arrays**: Postgres has native arrays, MySQL requires separate tables
- **UUIDs**: Postgres has UUID type, MySQL uses BINARY(16) or CHAR(36)
- **Extensions**: Postgres has `CREATE EXTENSION`, MySQL has no equivalent

## Important Rules

❌ **DON'T** edit `database/init/01-init.sql` for existing databases  
✅ **DO** create migrations for schema changes

❌ **DON'T** modify migrations after they're applied to production  
✅ **DO** create new migrations to change previous decisions

❌ **DON'T** drop data volume in production  
✅ **DO** use migrations to evolve schema safely
