# SEMalytics Integration Plan

This document outlines the strategy for integrating the PHP/Laravel frontend with Python backend services.

## Architecture Overview

The SEMalytics platform uses a polyglot architecture with:
- **PHP/Laravel**: Frontend application, user interface, and business logic
- **Python Services**: Specialized data processing and analytics components

## Integration Strategy

### 1. API-First Approach

All backend services will expose REST APIs that the Laravel frontend will consume:

```
Laravel Frontend ⟷ REST API ⟷ Python Services
```

Key principles:
- Clear API contracts and versioning
- Consistent authentication patterns
- Standardized error handling
- Comprehensive API documentation

### 2. Authentication & Authorization Flow

```
┌─────────────┐     ┌───────────────┐     ┌────────────────┐
│  User       │     │  Laravel      │     │  Python        │
│  Browser    │────▶│  Frontend     │────▶│  Microservices │
└─────────────┘     └───────────────┘     └────────────────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Auth System  │
                    └───────────────┘
```

#### Implementation Plan:
1. **Laravel Passport/Sanctum**: Implement OAuth2 server in Laravel
2. **JWT Token Passing**: Use signed JWT tokens for service-to-service communication
3. **Middleware**: Python services validate tokens via middleware
4. **Scoped Permissions**: Define granular access controls

### 3. Data Exchange Format

All services will use consistent JSON formats for data exchange:

```json
{
  "meta": {
    "status": "success|error",
    "code": 200,
    "message": "Operation successful"
  },
  "data": {
    // Response data
  },
  "pagination": {
    "current_page": 1,
    "per_page": 25,
    "total": 100,
    "total_pages": 4
  }
}
```

#### Implementation Plan:
1. Define shared schema specifications
2. Create response formatter libraries for each language
3. Implement validation on both sides

### 4. Error Handling Strategy

Consistent error format across all services:

```json
{
  "meta": {
    "status": "error",
    "code": 400,
    "message": "Validation failed"
  },
  "errors": [
    {
      "field": "campaign_name",
      "message": "Campaign name is required"
    }
  ]
}
```

#### Implementation Plan:
1. Define standard error codes and messages
2. Create error handler middleware for each service
3. Implement client-side error parsing and display

### 5. Development Environment

Docker-based development environment to ensure consistency:

```yaml
# docker-compose.yml excerpt
services:
  laravel-app:
    build: ./semaltyics-app
    ports:
      - "8000:80"
  
  vectorsem:
    build: ./vectorsem
    ports:
      - "8001:8000"
  
  uszipcode:
    build: ./uszipcode-service
    ports:
      - "8002:8000"
  
  meta-analysis:
    build: ./meta-analysis-engine
    ports:
      - "8003:8000"
```

#### Implementation Plan:
1. Create Docker Compose setup for local development
2. Implement service discovery for local environment
3. Setup shared environment variables

## Integration Phases

### Phase 1: Foundation (1-2 Months)

1. **API Contracts**
   - Define OpenAPI/Swagger specifications for each service
   - Implement authentication flow
   - Create basic health check endpoints

2. **Development Environment**
   - Docker Compose setup
   - Shared configuration
   - Local service discovery

3. **Authentication System**
   - Laravel Passport/Sanctum implementation
   - Token validation in Python services
   - User management API

### Phase 2: Core Services (2-3 Months)

1. **VectorSEM Integration**
   - Keyword clustering API
   - Model management endpoints
   - Result caching mechanism

2. **USZipcode.py Integration**
   - Geographic data retrieval API
   - Demographic reporting endpoints
   - Data synchronization strategy

3. **Initial Frontend Components**
   - Service status dashboard
   - User management interface
   - API explorer

### Phase 3: Advanced Features (3-4 Months)

1. **Meta-Analysis Engine Integration**
   - Analytics processing API
   - Reporting endpoints
   - Data visualization components

2. **Campaign Management**
   - Campaign data structure
   - Performance tracking
   - Optimization recommendations

3. **Cross-Service Features**
   - Unified search
   - Comprehensive reporting
   - Integrated dashboards

## API Endpoint Map

### Laravel Frontend

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/register` | POST | User registration |
| `/api/campaigns` | GET | List user campaigns |
| `/api/campaigns/{id}` | GET | Get campaign details |
| `/api/reports` | GET | List available reports |

### VectorSEM Service

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/cluster` | POST | Cluster keywords |
| `/api/embeddings` | POST | Generate word embeddings |
| `/api/similarity` | POST | Calculate keyword similarity |

### USZipcode.py Service

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/zipcode/{code}` | GET | Get ZIP code data |
| `/api/demographics/{code}` | GET | Get demographic data |
| `/api/realestate/{code}` | GET | Get real estate data |

### Meta-Analysis Engine

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/analyze/campaign` | POST | Analyze campaign data |
| `/api/analyze/keywords` | POST | Analyze keyword performance |
| `/api/forecast` | POST | Generate performance forecast |

## Service Communication Diagram

```
┌──────────────────┐                ┌────────────────────┐
│                  │                │                    │
│  Laravel         │◀───REST API────│  VectorSEM         │
│  Frontend        │                │  (Python)          │
│                  │─────REST API──▶│                    │
│                  │                │                    │
└──────┬───────────┘                └────────────────────┘
       │
       │                            ┌────────────────────┐
       │                            │                    │
       │◀───REST API────────────────│  USZipcode.py      │
       │                            │  (Python)          │
       │─────REST API──────────────▶│                    │
       │                            │                    │
       │                            └────────────────────┘
       │
       │                            ┌────────────────────┐
       │                            │                    │
       │◀───REST API────────────────│  Meta-Analysis     │
       │                            │  (Python)          │
       │─────REST API──────────────▶│                    │
       │                            │                    │
       │                            └────────────────────┘
       │
       │                            ┌────────────────────┐
       │◀───OAuth2/JWT─────────────▶│  Authentication    │
       │                            │  Service           │
       │                            │                    │
       └────────────────────────────┘                    │
                                    └────────────────────┘
```

## Implementation Checklist

### Laravel Frontend

- [ ] Set up Laravel project with authentication scaffolding
- [ ] Implement API client services for each backend service
- [ ] Create OAuth2 server using Laravel Passport
- [ ] Implement API response handling and error management
- [ ] Create base UI components and layouts
- [ ] Set up testing infrastructure

### Python Services

- [ ] Implement FastAPI base structure for each service
- [ ] Create authentication middleware for JWT validation
- [ ] Define shared response and error formats
- [ ] Implement health check endpoints
- [ ] Set up containerization with Docker
- [ ] Configure CI/CD pipeline for automated testing

### Infrastructure

- [ ] Create Docker Compose configuration for local development
- [ ] Set up service discovery mechanism
- [ ] Configure shared environment variables
- [ ] Implement logging and monitoring strategy
- [ ] Create deployment scripts for each environment

## Next Steps

1. **Finalize API Contracts**: Complete OpenAPI specifications for each service
2. **Set Up Development Environment**: Configure Docker Compose and local services
3. **Implement Authentication Flow**: Create unified authentication system
4. **Create Service Skeletons**: Implement basic endpoints and health checks

---

Last updated: July 23, 2025
Managed by: Virtual Project Manager
