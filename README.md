# 🛰️ TeleMind — AI Visualization Engine for Telecom Analytics

> **Ask a question. Get an enterprise dashboard. Instantly.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.dev)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-10-red?logo=flyway)](https://flywaydb.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 📖 What is TeleMind?

**TeleMind** is an enterprise-grade, multi-tenant **AI-powered Telecom Analytics SaaS platform**. It empowers telecom operators, network planners, and financial executives to ask natural language questions about complex network and subscriber datasets and immediately receive dynamically rendered visualizations — without writing SQL or building dashboards manually.

### Core Capabilities

- 🤖 **Dual-Engine AI Intelligence**: Works out-of-the-box with **Local Ollama (llama3)** or **OpenAI (GPT-4o)**, backed by a deterministic keyword heuristics fallback engine.
- 🎨 **Adaptive A2UI Protocol**: Translates complex SQL result sets into structured **A2UI JSON** payloads for dynamic client-side UI generation.
- 📊 **Rich Telecom Visualization Suite**: 
  - Standard BI: Line, Bar, Pie, Heatmap, Sortable & Searchable Tables, KPI Cards.
  - Specialized BI: Radar profiles, Market Share Treemaps, Subscriber Funnels, Financial Waterfalls, Bullet/SLA charts.
  - Telecom Advanced: **Google Maps Geospatial Studio** (tower clustering & coverage) and **Link Analysis Relationship Graphs** (CDR handoffs, fraud rings).
- 📁 **Custom CSV Dataset Studio**: Upload custom telecom CSVs; automatic schema inference, table creation, and multi-tenant isolated querying.
- 🗄️ **Enterprise Multi-Tenancy**: Strict tenant isolation across PostgreSQL with automated query injection, role-based Spring Security (BCrypt), and JWT validation.
- 💾 **Workspace & Dashboard Persistence**: Save, customize, and reload dynamic dashboard configurations per tenant.

---

## 🔄 The Pipeline

```
            Natural Language Query
                      ↓
       [ AI Understanding & Prompt Layer ]
                      ↓
        [ SQL Generation & Validation ]
      (Ollama LLaMA3 / OpenAI / Heuristics)
                      ↓
          [ Secure Query Execution ]
    (PostgreSQL 16 + Multi-Tenant Isolation)
                      ↓
       [ Visualization Decision Engine ]
 (Maps intent + data shape → optimal component)
                      ↓
             [ A2UI JSON Response ]
                      ↓
       [ Angular 21 Dynamic Renderer ]
 (Google Maps / Link Graph / Charts / KPI / Tables)
```

---

## 💡 Example Queries & Visualization Mapping

| Query Intent | Sample Natural Language Prompt | Rendered Component |
|---|---|---|
| **Revenue Trends** | *"Show revenue trend for last 30 days"* | 📈 Line Chart |
| **Top Performers** | *"Show top 10 subscribers by recharge amount"* | 📊 Bar Chart |
| **Regional Comparison** | *"Compare data usage by region"* | 🗺️ Regional Heatmap / Map |
| **Subscriber Audit** | *"Show inactive subscribers"* | 📋 Sortable Data Table |
| **Geospatial Towers** | *"Show tower coordinates on google map"* | 📍 Google Maps GIS Studio |
| **Fraud & Call Graph** | *"Show caller link analysis and fraud rings"* | 🕸️ Network Link Analysis Graph |
| **Network Capability** | *"Show network capability radar profile"* | 🕸️ Radar / Spider Chart |
| **Market Share** | *"Show subscriber market share treemap"* | 🔲 Treemap |
| **Funnel Conversion**| *"Show subscriber onboarding funnel"* | 🔻 Funnel Chart |
| **Financial Walk**   | *"Show quarterly revenue variance waterfall"*| 🪜 Waterfall Chart |
| **Executive KPI**    | *"How many active subscribers?"* | 🔢 KPI Metric Card |

---

## 🏗️ System Architecture

```
TeleMind/
├── backend/                              # Spring Boot 3.4.1 (Java 21)
│   ├── src/main/java/com/telemind/analytics/
│   │   ├── TeleMindApplication.java     # Application entry point
│   │   ├── a2ui/                         # A2UI JSON Protocol Definitions
│   │   │   ├── A2UIResponse.java         # Envelope response model
│   │   │   ├── A2UIPage.java             # Dynamic page layout model
│   │   │   ├── A2UIComponent.java        # Component specification model
│   │   │   ├── A2UIEvent.java            # Interactive events (click, drilldown)
│   │   │   ├── A2UIAction.java           # Contextual triggers & filters
│   │   │   └── ResponseBuilderService.java # A2UI builder service
│   │   ├── ai/                           # AI & Decision Pipeline
│   │   │   ├── PromptService.java        # System prompts & schema injection
│   │   │   ├── SqlGeneratorService.java  # Ollama/OpenAI client & JSON parser
│   │   │   └── VisualizationService.java # Heuristic visualization classifier
│   │   ├── controller/                   # REST Endpoints
│   │   │   ├── AnalyticsController.java  # Natural language query & drill-down
│   │   │   ├── AuthController.java       # JWT authentication & session
│   │   │   ├── DashboardController.java  # Workspace & layout persistence
│   │   │   └── DatasetController.java    # Custom CSV upload & schema generator
│   │   ├── model/                        # JPA Entities
│   │   │   ├── CustomDataset.java        # Dynamic dataset metadata
│   │   │   └── DashboardConfig.java      # Saved dashboard layouts
│   │   ├── query/                        # Query Execution & Security
│   │   │   ├── QueryExecutorService.java # Parameterized tenant query execution
│   │   │   └── SqlValidatorService.java  # SQL AST / allowlist guardrails
│   │   └── security/                     # Spring Security & Multi-Tenancy
│   │       ├── SecurityConfig.java       # SecurityFilterChain & CORS
│   │       ├── JwtTokenProvider.java     # HS512 JWT generation/verification
│   │       ├── JwtFilter.java            # Request filter extracting tenant & claims
│   │       ├── TenantContext.java        # ThreadLocal tenant storage
│   │       ├── User.java                 # User entity (BCrypt credentials)
│   │       ├── UserRepository.java       # User JPA repository
│   │       ├── UserDetailsServiceImpl.java # Custom user details loader
│   │       └── RateLimitingFilter.java   # Token bucket request throttling
│   └── src/main/resources/
│       ├── application.properties        # Backend configuration
│       └── db/migration/                 # Flyway Schema Migrations
│           ├── V1__create_schema.sql     # users, subscriber, revenue, usage
│           ├── V2__seed_data.sql         # Seed data & BCrypt hashed users
│           ├── V3__create_dashboard_configs.sql # Workspace layouts
│           └── V4__create_custom_datasets.sql   # Custom dynamic datasets
│
├── frontend/                             # Angular 21 (Standalone + Signals)
│   ├── src/app/
│   │   ├── app.ts                        # Root component with Signal reactivity
│   │   ├── app.html                      # Workspace, query bar & canvas template
│   │   ├── core/
│   │   │   ├── models/                   # A2UI TypeScript models
│   │   │   └── services/                 # API, Authentication, Dataset, Registry
│   │   └── shared/components/
│   │       ├── a2ui-chart/               # SVG Charts (Line, Bar, Pie, Radar, etc.)
│   │       ├── a2ui-google-map/          # Interactive GIS Tower Map
│   │       ├── a2ui-link-analysis/       # Telecom Link & Fraud Graph
│   │       ├── a2ui-table/               # Sortable & searchable data table
│   │       ├── a2ui-kpi/                 # KPI status cards
│   │       ├── a2ui-map/                 # Regional SVG heatmap
│   │       └── a2ui-filter/              # Interactive drill-down filters
│
├── docker-compose.yml                    # PostgreSQL 16 + Backend + Frontend
├── GIT_DOCS.md                           # Repository Git workflow & guidelines
└── README.md
```

---

## 🚀 Quick Start (Docker)

The fastest and recommended way to spin up the entire TeleMind stack is with Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)
- *(Optional)* [Ollama](https://ollama.ai) running on host with `llama3` for offline local AI inference:
  ```bash
  ollama run llama3
  ```

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/telemind.git
cd telemind
```

### 2. Launch Services

```bash
docker compose up --build
```

Docker Compose will automatically:
1. Spin up a **PostgreSQL 16** container on port `5433` (preventing conflicts with local Postgres).
2. Execute **Flyway Migrations (V1 to V4)** to initialize tables and seed data.
3. Build and launch the **Spring Boot 3.4.1** backend on host networking.
4. Build the **Angular 21** frontend and serve it via Nginx on port `80`.

### 3. Service Ports & Endpoints

| Service | Address | Notes |
|---|---|---|
| **Frontend Web App** | [http://localhost](http://localhost) | Main interactive analytics console |
| **Backend REST API** | [http://localhost:8080](http://localhost:8080) | Spring Boot REST service |
| **PostgreSQL Database** | `localhost:5433` | Database: `telemind`, User: `yasinalikhan` |
| **Local Ollama LLM** | `http://localhost:11434` | Host AI inference server |

---

## 🔐 Default Credentials & Tenants

The database is pre-seeded with multi-tenant accounts secured by BCrypt password hashing:

| Username | Password | Role | Tenant ID | Organization |
|---|---|---|---|---|
| `admin` | `admin123` | `ROLE_ADMIN` | `tenant_1` | Afghan Wireless |
| `viewer` | `viewer123` | `ROLE_VIEWER` | `tenant_1` | Afghan Wireless |
| `roshan_admin` | `admin123` | `ROLE_ADMIN` | `tenant_2` | Roshan Telecom |

---

## 💻 Manual Local Development (Without Docker)

### 1. PostgreSQL Database Setup

Create a PostgreSQL database and configure credentials:

```sql
CREATE DATABASE telemind;
CREATE USER yasinalikhan WITH ENCRYPTED PASSWORD 'yasin_123';
GRANT ALL PRIVILEGES ON DATABASE telemind TO yasinalikhan;
```

### 2. Backend (Spring Boot 3.4.1)

**Requirements**: Java 21+, Maven 3.9+

```bash
cd backend
mvn spring-boot:run
```

The backend boots on port `8080`. Flyway will run automatically and apply all migrations (`V1` through `V4`).

### 3. Frontend (Angular 21)

**Requirements**: Node.js 20+, npm 10+

```bash
cd frontend
npm install
npm run start
```

The frontend development server starts at [http://localhost:4200](http://localhost:4200).

---

## 🔌 Complete REST API Reference

### 1. Authentication

#### User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "admin",
  "tenantId": "tenant_1"
}
```

---

### 2. Analytics & Natural Language Query

All requests require the `Authorization: Bearer <token>` header.

#### Natural Language Query
```http
POST /api/analytics/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Show revenue trend for last 30 days"
}
```

**Response (`200 OK`) — A2UI Payload**:
```json
{
  "version": "1.0.0",
  "page": {
    "title": "Daily Analytics Trend",
    "layout": "grid",
    "components": [
      {
        "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        "type": "chart",
        "props": {
          "chartType": "line",
          "xAxis": "date",
          "yAxis": "amount",
          "data": [
            { "date": "2026-06-08", "amount": 5200.00 },
            { "date": "2026-06-09", "amount": 4900.00 }
          ]
        },
        "events": []
      }
    ]
  },
  "actions": [],
  "metadata": {
    "latencyMs": 42,
    "cacheHit": false,
    "sql": "SELECT date, SUM(amount) AS amount FROM revenue WHERE tenant_id = ? GROUP BY date ORDER BY date ASC"
  }
}
```

#### Regional Drill-Down
```http
GET /api/analytics/drill-down?region=Kabul
Authorization: Bearer <token>
```

---

### 3. Workspaces & Saved Dashboards

#### List Tenant Dashboards
```http
GET /api/dashboards
Authorization: Bearer <token>
```

#### Save Dashboard Layout
```http
POST /api/dashboards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Executive Revenue Overview",
  "layoutConfig": "[{\"id\":\"card-1\",\"x\":0,\"y\":0,\"w\":6,\"h\":4}]"
}
```

---

### 4. Custom CSV Datasets

#### Upload CSV Dataset
```http
POST /api/datasets/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: test_sales.csv
```

#### List Custom Datasets
```http
GET /api/datasets
Authorization: Bearer <token>
```

#### Preview Dataset Data
```http
GET /api/datasets/{id}/preview
Authorization: Bearer <token>
```

---

## 🛡️ Multi-Tenant Security & Defense-in-Depth

1. **Strict Tenant Isolation**:
   - `TenantContext` maintains thread-bound tenant isolation via `ThreadLocal<String>`.
   - `QueryExecutorService` analyzes all generated queries and automatically enforces `WHERE tenant_id = ?` parameter binding.
   - Cross-tenant queries are blocked at both query generation and execution stages.
2. **SQL Injection Defense**:
   - `SqlValidatorService` enforces strict read-only queries (`SELECT` only).
   - Reject statements containing `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `EXEC`, or multiple statement semicolons.
3. **Authentication & Password Hashing**:
   - Spring Security `DaoAuthenticationProvider` verifies passwords using `BCryptPasswordEncoder` (12 rounds).
   - Stateless JWT tokens signed with SHA-512 (`HS512`).
4. **Adaptive Throttling**:
   - Built-in token bucket `RateLimitingFilter` safeguards API routes against denial-of-service attempts.

---

## 🗄️ Database Schema & Flyway Migrations

The database is versioned using Flyway migrations located in `backend/src/main/resources/db/migration/`:

| Version | Migration Script | Description |
|---|---|---|
| **V1** | `V1__create_schema.sql` | Baseline schema: `users`, `subscriber`, `revenue`, `usage` tables with tenant indexing |
| **V2** | `V2__seed_data.sql` | Telecom demo datasets & BCrypt pre-seeded credentials for `tenant_1` & `tenant_2` |
| **V3** | `V3__create_dashboard_configs.sql` | `dashboard_config` table for workspace layout persistence |
| **V4** | `V4__create_custom_datasets.sql` | `custom_datasets` table for tracking uploaded CSV schemas and dynamic tables |

---

## 🧪 Testing

### Backend Test Suite

```bash
cd backend
mvn test
```

Includes coverage for:
- `SqlValidatorServiceTest` — Guardrails against SQL injection & DDL attacks.
- `QueryExecutorServiceTest` — Strict tenant filter injection verification.
- `DashboardControllerTest` — Workspace layout API tests.
- `DatasetControllerTest` — Custom CSV ingestion and type inference validation.

### Frontend Test Suite

```bash
cd frontend
npm test
```

Runs component specs and unit tests using [Vitest](https://vitest.dev/).

---

## 📚 Git Workflow & Contribution

To learn about our branch strategy, Conventional Commits specification, pull request lifecycle, and Git commands for TeleMind development, please review:

👉 **[TeleMind Git Workflow & Developer Documentation (GIT_DOCS.md)](GIT_DOCS.md)**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<p align="center">Built with ❤️ for High-Performance Telecom Analytics</p>
