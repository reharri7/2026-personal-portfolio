# Production Docker Deployment

This guide explains how to deploy the portfolio application using Docker.

## Architecture

The production setup uses 3 Docker containers:
- **PostgreSQL**: Database (postgres:16-alpine)
- **Spring Boot Backend**: API server (Java 21)
- **Angular Frontend**: Web application served by Nginx

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your production values:**
   ```bash
   # Required secrets
   POSTGRES_PASSWORD=your_secure_password_here
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here

   # Optional configurations
   POSTGRES_DB=portfolio
   POSTGRES_USER=portfolio_user
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   SPRING_JPA_SHOW_SQL=false
   FRONTEND_PORT=80
   ```

3. **Build and start all services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **View logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

5. **Stop all services:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

## Configuration Details

### Required Environment Variables
- `POSTGRES_PASSWORD`: Database password (must be set)
- `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA secret key (must be set)

### Optional Environment Variables
- `POSTGRES_DB`: Database name (default: portfolio)
- `POSTGRES_USER`: Database user (default: portfolio_user)
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: Hibernate DDL mode (default: update)
- `SPRING_JPA_SHOW_SQL`: Show SQL queries in logs (default: false)
- `FRONTEND_PORT`: Port for the frontend (default: 80)

### Production Recommendations
- Set `SPRING_JPA_SHOW_SQL=false` in production
- Use `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` for production (after initial setup)
- Use strong, unique passwords for `POSTGRES_PASSWORD`
- Consider using Docker secrets for sensitive values in production environments

## Accessing the Application

- **Frontend**: http://localhost (or your configured `FRONTEND_PORT`)
- **Backend API**: http://localhost/api (proxied through Nginx)

## Data Persistence

Database data is persisted in a Docker volume named `portfolio_data`. To remove all data:
```bash
docker compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Check service status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Check specific service logs
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs postgres
```

### Rebuild after code changes
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Network Architecture

All services run on a private bridge network (`portfolio-network`):
- Frontend communicates with backend via internal network
- Backend communicates with PostgreSQL via internal network
- Only the frontend port is exposed to the host
- API requests are proxied from `/api` to the backend

## Security Notes

- Never commit `.env` file to version control
- Keep `.env.example` updated with new configuration options
- The `.env` file is already in `.gitignore`
- Use environment-specific values for each deployment environment
