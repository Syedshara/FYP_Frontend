# IoT IDS Platform

AI-powered Intrusion Detection System for IoT networks using Federated Learning with Homomorphic Encryption.

## 🚀 Quick Start

### First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Run the setup script** (PowerShell)
   ```powershell
   .\setup.ps1
   ```

   This will:
   - Check prerequisites (Docker, Node.js)
   - Install frontend dependencies
   - Create `.env` configuration file
   - Build Docker images
   - Start all services
   - Run database migrations

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. **Login with default credentials**
   - Username: `admin`
   - Password: `admin123`

---

## 📋 Daily Usage

### Start the project
```powershell
.\start.ps1
```

### Stop the project
```powershell
.\stop.ps1
```

---

## 🛠️ Prerequisites

- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PowerShell 5.1+** (included in Windows)

---

## 📁 Project Structure

```
project/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Auth, security, middleware
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── alembic/         # Database migrations
│   └── Dockerfile
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # Reusable components
│   │   ├── layouts/    # Layout components
│   │   ├── pages/      # Page components
│   │   ├── stores/     # Zustand state management
│   │   └── types/      # TypeScript types
│   └── package.json
├── fl_server/          # Federated Learning server
├── fl_client/          # Federated Learning client
├── fl_common/          # Shared FL utilities
├── model/              # Pre-trained models
├── data/               # Training data
├── docs/               # Documentation
├── docker-compose.dev.yml
├── setup.ps1           # Initial setup script
├── start.ps1           # Start all services
└── stop.ps1            # Stop all services
```

---

## 🔧 Manual Commands

### Backend

```bash
# View backend logs
docker logs iot_ids_backend -f

# Access backend container shell
docker exec -it iot_ids_backend bash

# Run database migrations
docker exec iot_ids_backend alembic upgrade head

# Create new migration
docker exec iot_ids_backend alembic revision --autogenerate -m "description"
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker

```bash
# View all running containers
docker-compose -f docker-compose.dev.yml ps

# View logs for all services
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build backend

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend

# Stop and remove all containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove all containers + volumes (⚠️ deletes database)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🎯 Features

- **Real-time Traffic Monitoring** - Monitor IoT device network traffic
- **CNN-LSTM Intrusion Detection** - Deep learning model for anomaly detection
- **Federated Learning** - Distributed model training across clients
- **Homomorphic Encryption** - CKKS encryption for privacy-preserving aggregation
- **Device Management** - Register and monitor IoT devices
- **Attack Pipeline Visualization** - 6-step detection pipeline
- **Automated Prevention** - Quarantine rules and threat mitigation
- **Dark/Light Theme** - User-configurable appearance

---

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (React auto-escaping)

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs
docker logs iot_ids_backend

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend
```

### Frontend can't connect to backend
- Ensure backend is running: `docker ps`
- Check backend logs: `docker logs iot_ids_backend`
- Verify Vite proxy configuration in `frontend/vite.config.ts`

### Database connection errors
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

### Port already in use
```bash
# Find process using port 8000 (backend)
netstat -ano | findstr :8000

# Find process using port 5173 (frontend)
netstat -ano | findstr :5173

# Kill process by PID
taskkill /F /PID <pid>
```

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📝 License

[Your License Here]

---

## 👥 Team

[Your Team Members]

---

## 📧 Support

For issues or questions, contact [your-email@example.com]
