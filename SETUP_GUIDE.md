# ILA Webapp - Complete Setup Guide

## 🎉 What We've Set Up

Your ILA (Interdisciplinary Learning Analytics) webapp now has a complete Docker-based setup with:

### 🏗️ Infrastructure

- **PostgreSQL Database** with comprehensive schema
- **Node.js/Express Backend API** with TypeScript
- **React Frontend** with TailwindCSS and modern UI
- **Docker Compose** orchestration
- **Nginx** for production-ready frontend serving

### 🔐 Authentication & Security

- JWT-based authentication
- Role-based access control (Student/Instructor/Admin)
- Secure password hashing with bcrypt
- Rate limiting and CORS protection
- Input validation and sanitization

### 📊 Database Schema

Complete PostgreSQL schema with:

- **Users**: Authentication, profiles, roles
- **Projects**: Project management and collaboration
- **Essays**: Essay storage and analysis
- **Feedbacks**: AI and instructor feedback
- **Tags**: Content categorization
- **Analytics**: Learning analytics tracking
- **Audit Logs**: System audit trail

## 🚀 Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Git

### 2. Setup & Run

```bash
# Make setup script executable (already done)
chmod +x ./setup.sh

# Run the setup script
./setup.sh

# Or manually:
cp .env.example .env
docker-compose up --build
```

### 3. Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:5050 (optional)

### 4. Default Login Credentials

- **Admin**: admin@ila.com / admin123
- **Instructor**: instructor@ila.com / instructor123
- **Student**: student1@ila.com / student123

## 📁 Project Structure

```
ila-webapp/
├── 🐳 Docker Configuration
│   ├── docker-compose.yml           # Main services
│   ├── docker-compose.prod.yml      # Production overrides
│   ├── Dockerfile                   # Frontend container
│   ├── nginx.conf                   # Nginx configuration
│   └── .env / .env.example          # Environment variables
│
├── 🗄️ Database
│   └── database/init/
│       ├── 01-init.sql              # Database schema
│       └── 02-seed.sql              # Initial data
│
├── 🔧 Backend API
│   └── backend/
│       ├── src/
│       │   ├── controllers/         # Request handlers
│       │   ├── middleware/          # Auth, validation, errors
│       │   ├── models/             # TypeScript types
│       │   ├── routes/             # API endpoints
│       │   ├── utils/              # Utilities (JWT, password)
│       │   └── server.ts           # Main server
│       ├── package.json            # Backend dependencies
│       ├── tsconfig.json           # TypeScript config
│       └── Dockerfile              # Backend container
│
└── 🎨 Frontend
    ├── src/
    │   ├── components/             # UI components
    │   ├── contexts/              # React contexts (Auth)
    │   ├── lib/                   # Utilities (API client)
    │   └── pages/                 # Application pages
    ├── package.json               # Frontend dependencies
    └── vite.config.ts            # Vite configuration
```

## 🛠️ Development Workflow

### Backend Development

```bash
cd backend
pnpm install
pnpm dev          # Development server
pnpm build        # Build for production
```

### Frontend Development

```bash
pnpm install
pnpm dev          # Development server
pnpm build        # Build for production
```

### Database Management

```bash
# Access PostgreSQL directly
docker-compose exec postgres psql -U ila_user -d ila_db

# View logs
docker-compose logs -f postgres

# Backup database
docker-compose exec postgres pg_dump -U ila_user ila_db > backup.sql
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user profile

### Projects

- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Essays

- `GET /api/essays` - Get user's essays
- `POST /api/essays` - Create new essay
- `GET /api/essays/:id` - Get essay with feedback
- `PUT /api/essays/:id` - Update essay
- `DELETE /api/essays/:id` - Delete essay

## 🔧 Configuration

### Environment Variables

Edit `.env` to customize:

```bash
# Database
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=your-secure-password

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_PORT=5432
```

## 📈 Features Implemented

### Frontend Features

- ✅ User authentication with JWT
- ✅ Protected routes and role-based access
- ✅ Project management interface
- ✅ Responsive design with TailwindCSS
- ✅ Error handling and loading states
- ✅ API integration with type safety

### Backend Features

- ✅ RESTful API with Express.js
- ✅ JWT authentication middleware
- ✅ Role-based authorization
- ✅ Input validation and sanitization
- ✅ PostgreSQL integration with connection pooling
- ✅ Comprehensive error handling
- ✅ Request logging and rate limiting
- ✅ Security headers and CORS

### Database Features

- ✅ Complete schema for educational analytics
- ✅ User management with roles
- ✅ Project and essay management
- ✅ Feedback and tagging system
- ✅ Analytics event tracking
- ✅ Audit logging for compliance

## 🚀 Production Deployment

### Using Production Overrides

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Security Considerations

- Change default passwords in production
- Use strong JWT secrets
- Enable HTTPS
- Configure firewall rules
- Regular security updates
- Environment variable security

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**

   ```bash
   # Change ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=3002
   ```

2. **Database connection issues**

   ```bash
   # Reset everything
   docker-compose down -v
   docker-compose up --build
   ```

3. **Permission issues**

   ```bash
   chmod +x setup.sh
   sudo chown -R $USER:$USER .
   ```

4. **View logs**
   ```bash
   docker-compose logs -f [service-name]
   ```

5. **No seed users available (bypass login temporarily)**
   ```bash
   # Enable the frontend auth bypass in your local environment
   echo "VITE_BYPASS_AUTH=true" >> .env.local

   # Optionally customise the mocked user (all optional)
   echo "VITE_BYPASS_USER_EMAIL=developer@ila.dev" >> .env.local
   echo "VITE_BYPASS_USER_NAME=Developer User" >> .env.local
   echo "VITE_BYPASS_USER_ROLE=admin" >> .env.local
   ```
   With the bypass flag enabled, the React app automatically treats you as logged in
   without contacting the backend. Disable `VITE_BYPASS_AUTH` once your database is
   seeded so that real authentication is used again.

## 🎯 Next Steps

### Ready to Implement

1. **Essay Analysis**: Add AI-powered essay analysis
2. **Real-time Collaboration**: WebSocket integration
3. **File Upload**: Essay file handling
4. **Advanced Analytics**: Learning analytics dashboard
5. **Notifications**: Real-time user notifications
6. **OAuth Integration**: Google/Microsoft login
7. **Mobile App**: React Native implementation

### Development Workflow

1. Create feature branches
2. Test with Docker environment
3. Update API documentation
4. Add unit/integration tests
5. Deploy to staging/production

## 📚 Documentation

- **Backend API**: See `backend/README.md`
- **Docker Setup**: See `DOCKER_README.md`
- **Database Schema**: See `db-schema.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## 📞 Support

Your ILA webapp is ready for development! The Docker environment provides:

- Consistent development environment
- Easy database management
- Production-ready configuration
- Comprehensive logging and monitoring

Happy coding! 🎉
