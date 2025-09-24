# 🐘 pgAdmin Database Management Guide

pgAdmin is now enabled and running! You can visually explore and manage your PostgreSQL database.

## 🌐 Access pgAdmin

**URL**: http://localhost:5050

### 🔐 Login Credentials

- **Email**: admin@ila.com
- **Password**: admin123

## 🏗️ Setup Database Connection

Once you're logged into pgAdmin, follow these steps to connect to your ILA database:

### 1. Add New Server

1. Right-click on "Servers" in the left panel
2. Select "Register" → "Server..."

### 2. General Tab

- **Name**: ILA Database
- **Server group**: Servers (default)

### 3. Connection Tab

- **Host name/address**: `postgres` (this is the Docker service name)
- **Port**: `5432`
- **Maintenance database**: `ila_db`
- **Username**: `ila_user`
- **Password**: `ila_secure_password_2025`

### 4. Save Connection

Click "Save" to establish the connection.

## 📊 Explore Your Database Structure

Once connected, you'll see the following structure:

```
ILA Database
├── 📁 Databases
│   └── 📁 ila_db
│       ├── 📁 Schemas
│       │   └── 📁 public
│       │       ├── 📁 Tables
│       │       │   ├── 📋 users
│       │       │   ├── 📋 oauth_accounts
│       │       │   ├── 📋 courses
│       │       │   ├── 📋 assignments
│       │       │   ├── 📋 assignment_submissions
│       │       │   ├── 📋 essays
│       │       │   ├── 📋 feedbacks
│       │       │   ├── 📋 tags
│       │       │   ├── 📋 essay_tags
│       │       │   ├── 📋 analytics_events
│       │       │   ├── 📋 audit_logs
│       │       │   ├── 📋 notifications
│       │       │   ├── 📋 projects
│       │       │   └── 📋 project_members
│       │       └── 📁 Indexes
│       └── 📁 Extensions
```

## 🔍 Key Features You Can Use

### 1. **View Table Data**

- Right-click any table → "View/Edit Data" → "All Rows"
- See all your users, projects, essays, etc.

### 2. **Run SQL Queries**

- Click "Query Tool" button (SQL icon)
- Run custom queries to explore your data

### 3. **Visual Schema Explorer**

- Right-click table → "Properties" to see column details
- View relationships between tables

### 4. **Database Statistics**

- Monitor database size, connections, activity

## 📝 Useful SQL Queries to Try

```sql
-- View all users
SELECT * FROM users;

-- View all projects with owner information
SELECT
    p.*,
    u.display_name as owner_name
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id;

-- View database table sizes
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    null_frac
FROM pg_stats
WHERE schemaname = 'public';

-- View all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

## 🛠️ Database Management Tasks

### Create Backups

1. Right-click on "ila_db"
2. Select "Backup..."
3. Configure backup options
4. Save backup file

### Import/Export Data

1. Right-click on table
2. Select "Import/Export Data..."
3. Choose CSV or other format

### View Logs and Activity

1. Go to "Dashboard" tab
2. Monitor active connections
3. View performance metrics

## 🔧 Troubleshooting

### Can't Connect to Database?

- Make sure all Docker containers are running: `docker-compose ps`
- Check if postgres container is healthy
- Verify you're using `postgres` as the hostname (not `localhost`)

### Forgotten Credentials?

Check your `.env` file or use defaults:

- pgAdmin: admin@ila.com / admin123
- Database: ila_user / ila_secure_password_2025

### Performance Issues?

- Close unused query tabs
- Refresh the browser if pgAdmin becomes unresponsive

## 🎯 Next Steps

1. **Explore Current Data**: Check the users and projects we created via API
2. **Understand Schema**: Explore table relationships and constraints
3. **Monitor Usage**: Watch how data changes as you use the API
4. **Backup Strategy**: Set up regular database backups

Happy database exploring! 🎉
