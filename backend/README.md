# ILA Backend API

Node.js/Express backend for the Interdisciplinary Learning Analytics webapp with PostgreSQL database.

## 🚀 Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Authorization**: Role-based access control (student/instructor/admin)
- **Database**: PostgreSQL with connection pooling
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Express-validator for input validation
- **Logging**: Morgan for request logging
- **TypeScript**: Full TypeScript support

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit environment variables
nano .env
```

## 🛠️ Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🗄️ Database

### Setup

```bash
# Run migrations (applies schema changes)
pnpm db:migrate

# Rollback last migration (if needed)
pnpm db:migrate:down

# Create a new migration
pnpm db:migrate:create my-migration-name

# Seed database
pnpm db:seed
```

**📖 For detailed migration documentation, see:**
- [MIGRATIONS.md](./MIGRATIONS.md) - Complete migration guide
- [MIGRATIONS_QUICKREF.md](./MIGRATIONS_QUICKREF.md) - Quick reference

**⚠️ Important:** Never edit `database/init/01-init.sql` for existing databases. Use migrations instead.

### Schema

The database includes the following main tables:

- **users**: User authentication and profiles
- **oauth_accounts**: OAuth provider accounts
- **projects**: Project management
- **project_members**: Project collaboration
- **essays**: Essay content and metadata
- **feedbacks**: Automated and manual feedback
- **tags**: Content categorization
- **essay_tags**: Many-to-many essay-tag relationships
- **analytics_events**: Learning analytics tracking
- **audit_logs**: System audit trail
- **notifications**: User notifications

## 🔗 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile

### Users (`/api/users`)

- `GET /` - Get all users (admin only)
- `GET /:id` - Get user by ID

### Projects (`/api/projects`)

- `GET /` - Get user's projects
- `POST /` - Create new project
- `GET /:id` - Get project details
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

### Essays (`/api/essays`)

- `GET /` - Get user's essays
- `POST /` - Create new essay
- `GET /:id` - Get essay details
- `PUT /:id` - Update essay
- `DELETE /:id` - Delete essay

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

```javascript
// Login request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "student"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}

// Use token in subsequent requests
Authorization: Bearer jwt-token
```

## 🛡️ Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Secrets**: Configurable via environment variables
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable origin policy
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection**: Parameterized queries throughout

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── authController.ts
│   │   └── projectController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── errorHandler.ts # Global error handler
│   │   └── notFound.ts     # 404 handler
│   ├── models/             # Data models and types
│   │   ├── database.ts     # Database connection
│   │   ├── User.ts         # User types
│   │   ├── Project.ts      # Project types
│   │   └── Essay.ts        # Essay types
│   ├── routes/             # API routes
│   │   ├── auth.ts         # Authentication routes
│   │   ├── users.ts        # User management
│   │   ├── projects.ts     # Project routes
│   │   └── essays.ts       # Essay routes
│   ├── utils/              # Utility functions
│   │   ├── jwt.ts          # JWT utilities
│   │   └── password.ts     # Password utilities
│   └── server.ts           # Application entry point
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 🚀 Docker

```bash
# Build Docker image
docker build -t ila-backend .

# Run container
docker run -p 3001:3001 --env-file .env ila-backend

# Or use docker-compose from root directory
docker-compose up backend
```

## 📝 Logging

The application uses structured logging:

```typescript
// Query logging
console.log("Executed query", { text, duration, rows });

// Error logging
console.error("Error:", {
  message: err.message,
  stack: err.stack,
  statusCode,
  url: req.url,
  method: req.method,
  ip: req.ip,
});
```

## 🔍 Debugging

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Database query logging
DEBUG=database pnpm dev

# Authentication debugging
DEBUG=auth pnpm dev
```

## 📈 Performance

- **Database Connection Pooling**: PostgreSQL connection pool with 20 max connections
- **Query Optimization**: Indexed frequently queried columns
- **Response Compression**: Gzip compression enabled
- **Caching**: Redis caching for session management (can be added)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Follow existing code style
5. Validate all inputs
6. Handle errors gracefully

## 📚 Dependencies

### Production

- **express**: Web framework
- **pg**: PostgreSQL client
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT implementation
- **helmet**: Security middleware
- **cors**: CORS handling
- **express-rate-limit**: Rate limiting
- **express-validator**: Input validation
- **morgan**: HTTP request logger
- **dotenv**: Environment variables

### Development

- **typescript**: TypeScript compiler
- **tsx**: TypeScript execution
- **@types/\***: TypeScript definitions

## 📄 License

MIT License - see LICENSE file for details.
