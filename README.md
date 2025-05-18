# Employee Hierarchy System

This project implements an employee hierarchy system with a NestJS backend API and a NextJS frontend application. The system allows users to view all employees under any given position in the company's organizational structure.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Environment-Specific Deployments](#environment-specific-deployments)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [Deployment Best Practices](#deployment-best-practices)
- [Scaling](#scaling)
- [Logging and Monitoring](#logging-and-monitoring)
- [Security Considerations](#security-considerations)

## Features

- **Employee Hierarchy API**: Retrieve all employees under a specific position
- **JWT Authentication**: Secure API endpoints with JWT token authorization
- **User-friendly Frontend**: Next.Js UI display employee hierarchy data
- **Swagger Documentation**: Interactive API documentation
- **Rate Limiting**: Prevent abuse with request throttling
- **Structured Logging**: JSON-formatted logs for better observability
- **Containerization**: Docker setup for consistent deployment
- **Database**: PostgreSQL with TypeORM for data persistence
- **Performance Optimized**: Backend capable of handling 5000 concurrent requests

## System Architecture

The system follows a three-tier architecture:

1. **Presentation Layer**: NextJS frontend application
2. **Application Layer**: NestJS backend API
3. **Data Layer**: PostgreSQL database

### Backend Architecture

The backend follows NestJS's modular architecture:

- **Modules**: The application is divided into focused modules (auth, employees, logger)
- **Controllers**: Handle HTTP requests and define API endpoints
- **Services**: Contain business logic and interact with repositories
- **Entities**: TypeORM entity classes that map to database tables
- **DTOs**: Data Transfer Objects for validating request/response data
- **Interceptors**: Transform responses and handle cross-cutting concerns
- **Filters**: Handle exceptions throughout the application
- **Middleware**: Process requests before they reach route handlers
- **Guards**: Control access to routes based on conditions (like authentication)

### Frontend Architecture

The frontend is built with Next.js and follows its app directory structure:

- **App Router**: Utilizes Next.js 13+ app directory structure
- **API Routes**: Backend functionality within Next.js for authentication
- **Components**: Reusable UI components
- **Authentication**: Integration with NextAuth.js for secure authentication
- **Dashboard**: Main area for displaying employee hierarchy data

## Getting Started

### Prerequisites

- Node.js (v22+)
- npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running locally without Docker)

### Installation

#### Clone the repository
```bash
git clone https://github.com/zahidhasann88/employee-hierarchy.git
cd employee-hierarchy
```

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Create and configure your environment variables
npm run start:dev nest start # Start the development server
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env # Create and configure your environment variables
npm run dev  # Start the development server
```

### Configuration

#### Backend (.env)
```
# Application
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin123
DB_NAME=employee_hierarchy
DB_SSL=false
DB_POOL_SIZE=200
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY=3000
DB_MAX_QUERY_EXECUTION_TIME=1000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## API Documentation

The API documentation is available through Swagger UI at `/api/docs` when the backend server is running.

## Testing

### Backend Tests
```bash
cd backend
npm run test        # Run unit tests
```

### Frontend Tests
We can use Jest for unit and integration testing of React components, and Cypress for end-to-end (E2E) testing to simulate real user interactions in a Next.js app.

## Deployment

### Docker Deployment

The project includes Docker and Docker Compose configurations for easy deployment.

```bash
# Build and start the entire stack
docker-compose up -d --build

# Stop the stack
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific services
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Environment-Specific Deployments

#### Development Environment
```bash
# Development deployment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### Production Environment
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### Staging Environment
```bash
# Staging deployment
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Deployment Best Practices

1. **Environment Configuration**
   - Use environment-specific `.env` files
   - Never commit sensitive data to version control
   - Use secrets management for production credentials
   - Implement environment variable validation

2. **Database Management**
   - Use database migrations for schema changes
   - Implement database backup strategies
   - Monitor database performance
   - Use connection pooling effectively

3. **Application Deployment**
   - Implement health checks
   - Use rolling updates for zero-downtime deployments
   - Implement proper logging and monitoring
   - Set up proper SSL/TLS termination

4. **Security Measures**
   - Regular security audits
   - Dependency vulnerability scanning
   - Implement proper CORS policies
   - Use secure headers (Helmet)
   - Regular security patches

5. **Performance Optimization**
   - Enable compression
   - Implement caching strategies
   - Optimize static assets
   - Use CDN for static content

### CI/CD Pipeline

The project includes GitHub Actions workflows for automated testing and deployment:

1. **Development Pipeline**
   - Run linting
   - Execute unit tests
   - Build Docker images
   - Deploy to development environment

2. **Staging Pipeline**
   - Run all tests
   - Security scanning
   - Build and push Docker images
   - Deploy to staging environment

3. **Production Pipeline**
   - Full test suite
   - Security and vulnerability scanning
   - Build and push Docker images
   - Deploy to production with approval

## Scaling

The application is designed to handle high load and can be scaled in several ways:

### Horizontal Scaling
- **API Servers**: Deploy multiple instances behind a load balancer
- **Database**: Implement read replicas for read-heavy operations

### Performance Optimizations
- **Connection Pooling**: The PostgreSQL connection pool is configured with 200 connections
- **Query Optimization**: TypeORM is configured to log slow queries for optimization
- **Caching**: Implement Redis caching for frequently accessed data
- **Rate Limiting**: Throttling is implemented to prevent abuse

### Kubernetes Deployment
For production environments requiring automatic scaling, Kubernetes can be used:
- Deploy API servers as a StatelessSet with HorizontalPodAutoscaler
- Use a managed PostgreSQL service or deploy with StatefulSet
- Implement Ingress for routing and TLS termination

## Logging and Monitoring

### Logging Strategy
- **Structured Logging**: JSON-formatted logs for better parsing
- **Request ID Tracking**: Correlation IDs for tracking requests across services
- **Log Levels**: Different log levels (debug, info, warn, error) for appropriate filtering

### Monitoring Setup
For production monitoring, consider implementing:

1. **Metrics Collection**:
   - Prometheus for metrics collection
   - Grafana for visualization
   - Key metrics: Request rate, error rate, response time, CPU/memory usage

2. **Distributed Tracing**:
   - Jaeger or Zipkin for request tracing
   - OpenTelemetry for instrumentation

3. **Alerting**:
   - Set up alerts for error spikes, high latency, and resource constraints
   - PagerDuty or similar for alert management

4. **Centralized Logging**:
   - ELK Stack (Elasticsearch, Logstash, Kibana) or Loki for log aggregation
   - Fluentd or Logstash for log collection and forwarding

## Security Considerations

The application implements several security measures:

- **Helmet Middleware**: HTTP headers for security
- **JWT Authentication**: Secure authentication and authorization
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Data validation using class-validator and Joi
- **Error Handling**: Custom exception filters to prevent leaking sensitive information

Additional security recommendations:
- Implement HTTPS for all communications
- Set up proper CORS policies
- Regularly update dependencies for security patches
- Implement audit logging for sensitive operations