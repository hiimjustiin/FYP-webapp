# ILA Webapp - Docker Setup

This guide will help you set up the Interdisciplinary Learning Analytics (ILA) webapp using Docker with PostgreSQL database and basic user authentication.

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ila-webapp

# Copy environment variables
cp .env.example .env

# Edit environment variables (optional)
nano .env
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **pgAdmin** (optional): http://localhost:5050

### 4. Default Login Credentials

- **Admin**: admin@ila.com / admin123
- **Instructor**: instructor@ila.com / instructor123
- **Student**: student1@ila.com / student123

## 📁 Project Structure

```
ila-webapp/
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Frontend Docker image
├── nginx.conf                  # Nginx configuration for frontend
├── .env                        # Environment variables
├── backend/                    # Node.js/Express API
│   ├── Dockerfile             # Backend Docker image
│   ├── package.json           # Backend dependencies
│   └── src/                   # Backend source code
├── database/                   # Database initialization
│   └── init/                  # SQL initialization scripts
│       ├── 01-init.sql        # Database schema
│       └── 02-seed.sql        # Initial data
└── src/                       # Frontend React source code
```

## 🛠️ Development Workflow

### Start Development Environment

```bash
# Start all services in development mode
docker-compose up

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Management

```bash
# Access PostgreSQL directly
docker-compose exec postgres psql -U ila_user -d ila_db

# Backup database
docker-compose exec postgres pg_dump -U ila_user ila_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ila_user -d ila_db < backup.sql
```

### Backend Development

```bash
# Install backend dependencies
cd backend
pnpm install

# Run backend in development mode (outside Docker)
pnpm dev

# Build backend
pnpm build

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

### Frontend Development

```bash
# Install frontend dependencies
pnpm install

# Run frontend in development mode (outside Docker)
pnpm dev

# Build frontend
pnpm build
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to customize configuration:

```bash
# Database
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=your-secure-password

# Backend
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_PORT=5432
```

### Database Schema

The application includes comprehensive database schema with:

- **Users**: Authentication, roles, profiles
- **Projects**: Project management and collaboration
- **Essays**: Essay storage and management
- **Feedbacks**: AI and instructor feedback system
- **Tags**: Content categorization
- **Analytics**: Usage tracking and learning analytics

## 🚀 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID

### Projects

- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Essays

- `GET /api/essays` - Get user's essays
- `POST /api/essays` - Create new essay
- `GET /api/essays/:id` - Get essay details
- `PUT /api/essays/:id` - Update essay
- `DELETE /api/essays/:id` - Delete essay

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**:

   ```bash
   # Change ports in .env file or stop conflicting services
   docker-compose down
   # Edit .env file to change ports
   docker-compose up
   ```

2. **Database connection issues**:

   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up --build
   ```

3. **Permission issues**:

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Frontend not updating**:
   ```bash
   # Rebuild frontend
   docker-compose build frontend
   docker-compose up frontend
   ```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs postgres

# Follow logs
docker-compose logs -f
```

### Clean Up

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes database data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Complete cleanup
docker system prune -a
```

## 🎯 Production Deployment

### Environment Setup

1. Copy `.env.example` to `.env.production`
2. Update production values:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   POSTGRES_PASSWORD=strong-production-password
   ```

### Docker Compose Override

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Security Considerations

- Change default passwords
- Use strong JWT secrets
- Enable HTTPS in production
- Configure firewall rules
- Regular security updates

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test with Docker
5. Submit pull request

## 📝 License

MIT License - see LICENSE file for details.
