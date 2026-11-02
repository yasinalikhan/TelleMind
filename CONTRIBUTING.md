# 🤝 Contributing to TeleMind

Thank you for your interest in contributing to **TeleMind**! We welcome contributions from developers, designers, data scientists, and telecom specialists.

To ensure quality, security, and smooth collaboration across our monorepo, all contributors are expected to adhere to our standards and processes outlined below.

---

## 📜 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Git Workflow & Commit Standards](#git-workflow--commit-standards)
4. [Development Guidelines](#development-guidelines)
   - [Backend (Spring Boot & PostgreSQL)](#backend-spring-boot--postgresql)
   - [Frontend (Angular 21 & Signals)](#frontend-angular-21--signals)
5. [Testing & Quality Assurance](#testing--quality-assurance)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Reporting Bugs & Suggesting Features](#reporting-bugs--suggesting-features)

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Be respectful, constructive, and open to feedback.

---

## 2. Getting Started

1. **Fork the Repository**: Create a fork of `telemind` under your personal GitHub profile.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/telemind.git
   cd telemind
   ```
3. **Configure Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/gammanalytics/telemind.git
   ```
4. **Follow Quickstart**:
   Review the [README.md](README.md) to set up Docker or your local development environment.

---

## 3. Git Workflow & Commit Standards

We follow strict **Trunk-Based Development** and the **Conventional Commits 1.0.0** specification.

👉 **Please read our full [Git Workflow Documentation (GIT_DOCS.md)](GIT_DOCS.md)** before creating branches or submitting commits.

### Summary:
- Branch naming: `feat/<ticket>-description`, `fix/<ticket>-description`, `chore/...`
- Commit syntax: `<type>(<scope>): <subject>`
  - Example: `feat(frontend/map): add tower clustering to Google Maps component`
- Rebase your feature branch on `upstream/master` before opening a PR:
  ```bash
  git fetch upstream
  git rebase upstream/master
  ```

---

## 4. Development Guidelines

### Backend (Spring Boot & PostgreSQL)
- **Java 21**: Utilize modern Java 21 features (records, pattern matching, sealed classes).
- **Security & Multi-Tenancy**: Every database query touching subscriber, revenue, or usage tables must strictly enforce tenant isolation through `TenantContext.getCurrentTenant()`.
- **Flyway Migrations**: Never modify existing migration scripts (`V1`, `V2`, etc.). Add incremental migration files (`V5__your_feature.sql`) in `backend/src/main/resources/db/migration/`.
- **SQL Sanitization**: Any raw or dynamic SQL must be validated via `SqlValidatorService` to prevent SQL injection.

### Frontend (Angular 21 & Signals)
- **Standalone Components**: Do not introduce NgModules; build modern Standalone components.
- **State Management**: Prefer Angular Signals (`signal`, `computed`, `effect`) over mutable class properties.
- **Styling**: Use utility classes with Tailwind CSS; avoid monolithic custom CSS declarations.
- **A2UI Protocol**: Ensure all new visual components register their component type in `a2ui-registry.service.ts` and handle input validation.

---

## 5. Testing & Quality Assurance

Before submitting any Pull Request, ensure all tests pass cleanly:

### Backend Tests
```bash
cd backend
mvn clean test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 6. Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature
   ```
2. Open a Pull Request against `master`.
3. Provide a clear PR description:
   - What problem does this solve?
   - How was it tested?
   - Attach screenshots/GIFs for UI changes.
4. Verify that CI checks and automated linters pass.
5. Address code review comments promptly.

---

## 7. Reporting Bugs & Suggesting Features

- **Bug Reports**: Open an issue including environment details, reproducible steps, expected vs. actual behavior, and relevant logs.
- **Feature Requests**: Describe the use case in detail and why it benefits telecom operators or analytics workflows.

---

Thank you for helping build **TeleMind**! 🚀
