# 🛰️ TeleMind — AI Visualization Engine for Telecom Analytics

> **Ask a question. Get a dashboard. Instantly.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.dev)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 📖 What is TeleMind?

**TeleMind** is an enterprise-grade, multi-tenant **AI-powered Telecom Analytics SaaS platform**. It allows telecom operators to ask natural language questions about their network data and automatically receive the most appropriate data visualization — no SQL, no dashboard configuration required.

### The Pipeline

```
Natural Language Question
        ↓
  AI Understanding Layer
        ↓
  SQL Generation Engine
   (OpenAI / Heuristics)
        ↓
  Secure Query Executor
   (Tenant-Isolated H2)
        ↓
  Visualization Decision Engine
        ↓
    A2UI JSON Response
        ↓
  Angular Dynamic Renderer
  (Chart / Table / Map / KPI)
```

### Example Queries

| Question | Visualization |
|---|---|
| *"Show revenue trend for last 30 days"* | 📈 Line Chart |
| *"Show top 10 subscribers by recharge amount"* | 📊 Bar Chart |
| *"Compare data usage by region"* | 🗺️ Regional Map |
| *"Show inactive subscribers"* | 📋 Sortable Table |
| *"Display network usage on map"* | 🗺️ Heatmap + Map |
| *"How many active subscribers?"* | 🔢 KPI Card |

---

## 🏗️ Architecture

```
telemind/
├── backend/                    # Spring Boot (Java 21)
│   ├── src/main/java/com/telemind/analytics/
│   │   ├── TeleMindApplication.java
│   │   ├── a2ui/               # A2UI JSON Protocol Models
│   │   │   ├── A2UIResponse.java
│   │   │   ├── A2UIPage.java
│   │   │   ├── A2UIComponent.java
│   │   │   ├── A2UIEvent.java
│   │   │   ├── A2UIAction.java
│   │   │   └── ResponseBuilderService.java
│   │   ├── ai/                 # AI & Visualization Decision Layer
│   │   │   ├── PromptService.java
│   │   │   ├── SqlGeneratorService.java
│   │   │   └── VisualizationService.java
│   │   ├── controller/         # REST Controllers
│   │   │   ├── AnalyticsController.java
│   │   │   └── AuthController.java
│   │   ├── query/              # SQL Execution Layer
│   │   │   ├── QueryExecutorService.java
│   │   │   └── SqlValidatorService.java
│   │   └── security/           # JWT + Multi-Tenant Security
│   │       ├── JwtTokenProvider.java
│   │       ├── JwtFilter.java
│   │       ├── SecurityConfig.java
│   │       ├── TenantContext.java
│   │       └── RateLimitingFilter.java
│   └── src/main/resources/
│       ├── application.properties
│       ├── schema.sql
│       └── data.sql
│
├── frontend/                   # Angular 21 (Standalone + Signals)
│   └── src/app/
│       ├── core/
│       │   ├── models/         # A2UI TypeScript Interfaces
│       │   └── services/       # HTTP, Action, Validation, Registry Services
│       └── shared/components/
│           ├── a2ui-kpi/       # KPI Card Component
│           ├── a2ui-chart/     # Line / Bar / Pie / Heatmap (SVG)
│           ├── a2ui-table/     # Sortable + Searchable Table
│           ├── a2ui-map/       # SVG Network Region Map
│           └── a2ui-filter/    # Filter Bar Component
│
├── docker-compose.yml          # Full stack orchestration
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker | 24+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | v2+ | Included with Docker Desktop |
| Git | Any | [git-scm.com](https://git-scm.com) |

> **Java / Node.js / Maven are NOT required** — Docker handles everything.

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/telemind.git
cd telemind
```

### 2. (Optional) Add an OpenAI API Key

Without a key, the system uses a built-in **keyword heuristics engine** that handles all demo queries. To enable full natural language AI:

```bash
# Create a .env file in the project root
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

Or for a self-hosted/compatible API (Ollama, Groq, etc.):
```bash
echo "OPENAI_API_KEY=your-key" >> .env
echo "OPENAI_API_URL=http://localhost:11434/v1/chat/completions" >> .env
echo "OPENAI_MODEL=llama3" >> .env
```

### 3. Start the Full Stack

```bash
docker compose up --build
```

This will:
- Build the Spring Boot backend JAR
- Compile and bundle the Angular frontend
- Seed the H2 database with telecom sample data
- Start both services

| Service | URL |
|---|---|
| **Frontend Dashboard** | http://localhost |
| **Backend API** | http://localhost:8080 |
| **H2 Database Console** | http://localhost:8080/h2-console |

### 4. Log In

Open **http://localhost** in your browser.

| Field | Value |
|---|---|
| **Username** | `admin` |
| **Password** | `admin123` |
| **Tenant** | Select `Afghan Wireless` (T1) or `Roshan Telecom` (T2) |

Click **"Access Console"**.

### 5. Ask a Question

Type any of these into the query box, or click the suggestion chips:

```
Show revenue trend for last 30 days
Show top 10 subscribers by recharge amount
Compare data usage by region
Show inactive subscribers
Display network usage on map
```

---

## 🛠️ Running Without Docker (Development Mode)

### Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

> Requires **Java 21+** and **Maven 3.9+**

The backend starts at `http://localhost:8080`

### Frontend (Angular)

```bash
cd frontend
npm install
npm run start
```

> Requires **Node.js 22+**

The dev server starts at `http://localhost:4200`

---

## 🔌 API Reference

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "tenantId": "tenant_1"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9..."
}
```

---

### Natural Language Query

```http
POST /api/analytics/query
Authorization: Bearer <token>
X-Tenant-ID: tenant_1
Content-Type: application/json

{
  "query": "Show revenue trend for last 30 days"
}
```

**Response (A2UI JSON):**
```json
{
  "version": "1.0.0",
  "page": {
    "title": "Daily Analytics Trend",
    "layout": "grid",
    "components": [
      {
        "id": "uuid",
        "type": "chart",
        "props": {
          "chartType": "line",
          "xAxis": "date",
          "yAxis": "amount",
          "data": [...]
        },
        "events": [...]
      }
    ]
  },
  "actions": []
}
```

---

### Drill-Down

```http
GET /api/analytics/drill-down?region=Kabul
Authorization: Bearer <token>
X-Tenant-ID: tenant_1
```

---

## 🔐 Security Features

- **JWT Authentication** — HS512 signed tokens, configurable expiry
- **Multi-Tenant Isolation** — Every SQL query automatically injects `WHERE tenant_id = ?`
- **SQL Injection Prevention** — Allowlist-only validation (SELECT only, no DDL/DML)
- **Rate Limiting** — Token bucket per IP (10 requests / 10 seconds)
- **XSS Protection** — Recursive string sanitizer in Angular validation service
- **CORS** — Configurable allowed origins

---

## 🗃️ Database Schema

```sql
subscriber (id, msisdn, region, plan, status, recharge_amount, signup_date, tenant_id)
revenue    (id, date, region, amount, category, tenant_id)
usage      (id, tower, region, data_mb, voice_minutes, timestamp, tenant_id)
```

Sample data includes **2 tenants** for multi-tenancy testing:
- `tenant_1` → Afghan Wireless (12 subscribers, 31 days revenue, 11 towers)
- `tenant_2` → Roshan Telecom (isolated records)

---

## ⚙️ Configuration

| Property | Default | Description |
|---|---|---|
| `server.port` | `8080` | Backend port |
| `openai.api.key` | *(empty)* | OpenAI API key (optional) |
| `openai.api.url` | `https://api.openai.com/v1/chat/completions` | API endpoint |
| `openai.api.model` | `gpt-4o` | Model name |
| `app.jwt.secret` | auto-generated | JWT signing secret (change in production!) |
| `app.jwt.expiration` | `86400000` | Token expiry in ms (24h) |

---

## 🧪 Running Tests

```bash
cd backend
mvn test
```

Tests include:
- `SqlValidatorServiceTest` — SQL injection prevention
- `QueryExecutorServiceTest` — Tenant filter injection
- `TeleMindApplicationTests` — Spring context load

---

## 🗺️ Roadmap to Production

- [ ] Replace H2 with **PostgreSQL** + Flyway migrations
- [ ] Integrate **Keycloak / Auth0** for real identity management
- [ ] Add **Redis** for query result caching
- [ ] Schema-per-tenant multi-tenancy with Hibernate
- [ ] **Kubernetes** deployment manifests (Helm chart)
- [ ] **Prometheus + Grafana** monitoring stack
- [ ] Saved dashboards and scheduled PDF reports
- [ ] Real-time streaming via WebSockets (live tower data)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ for the Telecom Industry</p>
