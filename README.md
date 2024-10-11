# SC4013 Application Security (AY2024/2025)
> Implementation of SecureAPI in TypeScript running on Bun

## Team Members
- Budi Syahiddin
- Soh Wee Kiat

## Roadmap
- [ ] Authentication JWT
- [ ] Authorization and Access Control
- [ ] Secure Error Handling and Logging
- [ ] HTTPS Enforcement
- [ ] Architecture Diagram
- [x] OpenAPI Spec with Swagger
- [ ] API Design and Documentation
- [ ] Implementation of Core Functionality
- [ ] Integration of Security Features    
    - [x] GPG Signed commits
    - [x] Review Process
    - [ ] Error thrown reduction
    - [ ] Database R/W Account segregation
    - [x] Input Validation and Sanitization
    - [ ] Rate Limiting and Throttling
- [ ] Testing
  - [ ] Unit Tests
  - [ ] Integration Tests
  - [ ] Security Tests
- [ ] Deployment to a Cloud Platform (Optional)
- [ ] API Documentation
    - Comprehensive guide to using the API
- [ ] Implemented API with Source Code
    - Complete API code for reference
- [ ] Postman Collection for API Testing
    - Pre-configured requests for testing API functionality
- [ ] Security Features Explanation Document
    - Detailed explanation of API security measures
- [ ] Test Results and Security Analysis
    - Report on API testing and security evaluation
- [ ] Monitoring with Datadog
- [x] Dockerfile
- [ ] CI/CD DevSecOps
    - [x] Semantic Release
    - [ ] CD to Staging Environment
    - [ ] SAST
    - [ ] Container Scanning
- [ ] Endpoints
    - [x] `GET /api/v1/products`
    - [x] `GET /api/v1/products/:id`
    - [x] `PUT [Protected] /api/v1/products`
    - [x] `DELETE [Protected] /api/v1/products`
    - [x] `POST /api/v1/auth/login`
    - [x] `POST /api/v1/auth/register`
    - [x] `POST /api/v1/auth/logout`

# Architecture
TODO

## Setup
To install dependencies:

```bash
bun install
```

# Elysia with Bun runtime

## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

# Contribution
- Ensure that commit messages follow [Angular Commit Messages](https://gist.github.com/brianclements/841ea7bffdb01346392c)
- Create Merge Request with branch titled according to type. Example: `feat/jwt-impl` or `docs/update-readme`
- Ensure that commits as signed
