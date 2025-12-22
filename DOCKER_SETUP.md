# Docker Setup Guide

This project uses Docker Compose to provide MongoDB and MinIO (S3-compatible object storage) for local development.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Quick Start

### 1. Start the services

```bash
docker-compose up -d
```

This will start:

- **MongoDB**: Running on `localhost:27017`
- **MinIO**: Running on `localhost:9000` (API) and `localhost:9001` (UI)

### 2. Configure environment variables

Copy `.env.docker` to `.env` for Docker development:

```bash
cp .env.docker .env
```

Or if using AWS S3 directly (not MinIO), use the standard `.env.example`:

```bash
cp .env.example .env
```

Then update the AWS credentials in `.env` with your real AWS S3 credentials.

### 3. Create MinIO bucket (for local development only)

1. Access MinIO Console: http://localhost:9001
2. Login with:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. Create a bucket named `keep-a-budget-receipts`

Or use the MinIO CLI:

```bash
# Install mc (MinIO client)
# macOS
brew install minio/stable/mc

# Then configure and create bucket
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc mb myminio/keep-a-budget-receipts
```

### 4. Install dependencies and start development

```bash
npm install
npm run dev
```

## Services Details

### MongoDB

- **Image**: mongo:7.0
- **Container**: keep-a-budget-mongo
- **Port**: 27017
- **Default Database**: keep-a-budget
- **Username**: admin
- **Password**: password
- **Data Volume**: mongo_data (persisted)

### MinIO (S3-compatible)

- **Image**: minio/minio:latest
- **Container**: keep-a-budget-minio
- **API Port**: 9000
- **Console Port**: 9001
- **Default Username**: minioadmin
- **Default Password**: minioadmin
- **Data Volume**: minio_data (persisted)

## Useful Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mongo
docker-compose logs -f minio
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (reset data)

```bash
docker-compose down -v
```

### Access MongoDB shell

```bash
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin
```

### Access MinIO CLI

```bash
docker-compose exec minio mc ls myminio
```

## Environment Variables

### Docker Development (.env.docker)

```
MONGODB_URI=mongodb://admin:password@mongo:27017/keep-a-budget?authSource=admin
AWS_ENDPOINT_URL=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

### Production (.env.example)

Use real AWS S3 credentials and MongoDB URI from your cloud provider.

## Troubleshooting

### MongoDB connection refused

```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongo

# View logs
docker-compose logs mongo
```

### MinIO bucket not found

- Ensure the bucket exists in MinIO Console (http://localhost:9001)
- Check that AWS_ENDPOINT_URL is set to `http://minio:9000` in `.env`

### Permission denied errors

- Ensure Docker daemon is running
- On Linux, you might need to add your user to the docker group:
  ```bash
  sudo usermod -aG docker $USER
  ```

## Next Steps

1. Start the Docker services: `docker-compose up -d`
2. Create the MinIO bucket via the console or CLI
3. Update your `.env` file with Docker credentials
4. Run `npm run dev` to start the development server
