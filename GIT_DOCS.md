# 🛰️ TeleMind — Official Git Documentation & Engineering Standards

> **A definitive guide to version control, branching models, conventional commits, and collaboration protocols for the TeleMind codebase.**

---

## 📑 Table of Contents

1. [Introduction & Core Philosophy](#1-introduction--core-philosophy)
2. [Repository Structure & Monorepo Best Practices](#2-repository-structure--monorepo-best-practices)
3. [Branching Strategy](#3-branching-strategy)
   - [Branch Taxonomy](#branch-taxonomy)
   - [Branch Naming Conventions](#branch-naming-conventions)
4. [Commit Conventions (Conventional Commits 1.0.0)](#4-commit-conventions-conventional-commits-100)
   - [Structure of a Commit Message](#structure-of-a-commit-message)
   - [Allowed Commit Types](#allowed-commit-types)
   - [Valid Monorepo Scopes](#valid-monorepo-scopes)
   - [Commit Examples](#commit-examples)
5. [End-to-End Developer Workflow](#5-end-to-end-developer-workflow)
   - [Phase 1: Starting New Work](#phase-1-starting-new-work)
   - [Phase 2: Local Development & Staging](#phase-2-local-development--staging)
   - [Phase 3: Keeping Up to Date (Rebasing)](#phase-3-keeping-up-to-date-rebasing)
   - [Phase 4: Pull Request & Peer Review](#phase-4-pull-request--peer-review)
   - [Phase 5: Merging into Master](#phase-5-merging-into-master)
6. [Merge Conflicts & Rebase Playbook](#6-merge-conflicts--rebase-playbook)
7. [Stashing & Dirty Working Tree Hygiene](#7-stashing--dirty-working-tree-hygiene)
8. [Tagging, Releases & Semantic Versioning](#8-tagging-releases--semantic-versioning)
9. [Security, Gitignore & Secret Management](#9-security-gitignore--secret-management)
10. [Developer Cheatsheet for TeleMind](#10-developer-cheatsheet-for-telemind)

---

## 1. Introduction & Core Philosophy

The TeleMind repository houses a mission-critical, enterprise telecom analytics platform. Maintaining an immaculate, linear, and searchable Git history ensures that:

- **Traceability**: Every feature, bug fix, or schema change can be linked directly back to its rationale and ticket.
- **Rollback Safety**: Individual commits are atomic and safe to cherry-pick or revert without breaking unrelated subsystems.
- **CI/CD Reliability**: Continuous integration pipelines trigger targeted tests based on file changes and commit types.
- **Developer Velocity**: Clear branching and rebasing protocols minimize merge hell and conflict downtime.

---

## 2. Repository Structure & Monorepo Best Practices

TeleMind is organized as a unified monorepo encompassing the full stack:

```
TeleMind/
├── backend/          # Java 21 / Spring Boot 3.4.1 / Flyway Migrations
├── frontend/         # Angular 21 / Tailwind CSS / Standalone Components
├── docker-compose.yml# Multi-container orchestration
└── README.md         # Primary documentation
```

### Monorepo Commit Segregation

- **Atomic Commits**: Keep backend changes and frontend changes in separate commits whenever feasible, unless they form an atomic contract change (e.g., modifying an A2UI JSON model simultaneously).
- **Scope Explicitly**: Always specify the subsystem in the commit scope (e.g., `feat(backend/ai): ...`, `fix(frontend/chart): ...`).
- **Never Commit Build Artifacts**: Ensure `backend/target/` and `frontend/dist/` or `node_modules/` are strictly ignored.

---

## 3. Branching Strategy

TeleMind adheres to a **Trunk-Based Development** model with short-lived feature branches.

```
master  ───────────────────●──────────────────●───────► (Always deployable)
          \               /                  /
feat/...   ●────●────●───/                  /
                      \                    /
fix/...                ●─────●────────────/
```

### Branch Taxonomy

| Branch Type | Target Parent | Naming Pattern | Description |
|---|---|---|---|
| **Production / Trunk** | — | `master` (or `main`) | The single source of truth. Always passing tests and deployable. |
| **Feature** | `master` | `feat/<ticket>-<short-description>` | New business capability or UI component. |
| **Bugfix** | `master` | `fix/<ticket>-<short-description>` | Remediation of a defect or edge case. |
| **Hotfix** | `master` | `hotfix/<short-description>` | Urgent production remediation bypassing standard queues. |
| **Refactor / Perf** | `master` | `refactor/<short-description>` | Code restructuring without feature addition. |
| **Chores / Ops** | `master` | `chore/<short-description>` | Dependency upgrades, docker tuning, or CI updates. |

### Branch Naming Conventions

- Use lower-case alphanumeric characters and hyphens (`-`).
- Always use descriptive, self-explanatory names.

```bash
# Good Branch Names
feat/TM-104-google-maps-gis
fix/TM-208-tenant-query-filter
chore/upgrade-spring-boot-3.4
refactor/chart-svg-renderer

# Bad Branch Names
my-branch
test
fix-bug
updates-yasin
```

---

## 4. Commit Conventions (Conventional Commits 1.0.0)

We strictly enforce the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

### Structure of a Commit Message

```
<type>(<scope>): <short imperative description>

[optional multi-line detailed body explaining the 'why' and context]

[optional footer(s): BREAKING CHANGE, Closes #123, Co-authored-by]
```

### Allowed Commit Types

| Type | Purpose | Example |
|---|---|---|
| `feat` | A new user-facing feature or API capability | `feat(ai): integrate local Ollama llama3 fallback` |
| `fix` | A bug fix for users or systems | `fix(security): sanitize regional filter inputs against injection` |
| `perf` | Performance improvement without changing behavior | `perf(query): add database index on revenue(tenant_id, date)` |
| `refactor`| Code change that neither fixes a bug nor adds a feature | `refactor(frontend): migrate chart state to Angular Signals` |
| `docs` | Documentation-only updates | `docs: rewrite repository README and git standards` |
| `test` | Adding missing tests or correcting existing tests | `test(backend): add test suite for SqlValidatorService` |
| `build` | Changes affecting build tooling or dependencies | `build(pom): bump jjwt version to 0.12.5` |
| `ci` | Changes to CI configuration scripts and workflows | `ci(github): add docker build cache to workflow` |
| `chore` | Maintenance tasks that do not alter src/test code | `chore: update docker-compose Postgres credentials` |

### Valid Monorepo Scopes

- `backend` (or specific packages: `backend/ai`, `backend/query`, `backend/security`, `backend/a2ui`)
- `frontend` (or specific modules: `frontend/chart`, `frontend/map`, `frontend/auth`, `frontend/table`)
- `db` (for Flyway migrations like `db/V4`)
- `docker` (for container and network configurations)
- `security` (for JWT, rate limiting, and RBAC)

### Commit Examples

#### Standard Feature Commit
```text
feat(backend/ai): support natural language geospatial queries for Google Maps

Enable the VisualizationService to recognize tower coordinates and telecom
coverage queries, producing a2ui 'google-map' payloads with regional markers.
```

#### Bug Fix with Issue Reference
```text
fix(backend/query): prevent cross-tenant data leakage on aggregated queries

Ensure GROUP BY clauses append tenant_id whenever dynamic user-uploaded
datasets are queried without an explicit tenant constraint.

Closes #42
```

#### Breaking Change Commit
```text
feat(a2ui)!: refactor component response payload structure

BREAKING CHANGE: The 'component' field in A2UIResponse has been renamed to
'components' and now yields an array instead of a single element.
```

---

## 5. End-to-End Developer Workflow

### Phase 1: Starting New Work

Always branch off a freshly updated `master`:

```bash
# 1. Checkout master and update from remote
git checkout master
git pull --rebase origin master

# 2. Create your isolated feature branch
git checkout -b feat/telecom-link-analysis
```

### Phase 2: Local Development & Staging

Work incrementally. Review changes frequently before committing:

```bash
# 1. Review status of modified and untracked files
git status

# 2. Inspect changes line-by-line
git diff

# 3. Stage specific files (avoid blanket `git add .` if unintended files are touched)
git add frontend/src/app/shared/components/a2ui-link-analysis/

# 4. Commit with Conventional Commits formatting
git commit -m "feat(frontend/graph): add telecom link analysis SVG component"
```

### Phase 3: Keeping Up to Date (Rebasing)

Never merge `master` into your feature branch. Instead, **rebase** your branch onto updated `master` to preserve a linear history:

```bash
# Fetch latest commits from remote
git fetch origin

# Rebase feature branch on top of latest master
git rebase origin/master
```

### Phase 4: Pull Request & Peer Review

Push your branch and open a Pull Request (PR):

```bash
# Push branch to remote
git push -u origin feat/telecom-link-analysis
```

#### Pull Request Checklist:
1. Title follows Conventional Commits format.
2. Code compiles cleanly (`mvn test` and `npm test` both pass).
3. No secrets, credentials, or `.env` files are included.
4. Includes screenshots or visual verification for frontend UI changes.

### Phase 5: Merging into Master

- **Preferred Method**: **Squash and Merge** (for small multi-commit branches) or **Rebase and Merge** (for clean, multi-step logical commits).
- **Avoid Merge Commits** (`git merge --no-ff`) directly on `master` unless executing a formal release integration.

---

## 6. Merge Conflicts & Rebase Playbook

When conflicts arise during `git rebase origin/master`:

```bash
# 1. Git will pause and flag conflicting files. Run status to list them:
git status

# 2. Open conflicting files and resolve conflict markers:
# <<<<<<< HEAD (current master state)
# =======
# >>>>>>> feat/my-branch (your incoming state)

# 3. Once resolved, stage the files:
git add <resolved-file-path>

# 4. Continue the rebase:
git rebase --continue

# Note: NEVER run 'git commit' during a rebase.

# 5. If rebase goes wrong, abort and reset cleanly:
git rebase --abort
```

---

## 7. Stashing & Dirty Working Tree Hygiene

If you need to switch branches while work is in progress:

```bash
# Save uncommitted changes with a descriptive message
git stash push -m "wip: google map tower clustering logic"

# List available stashes
git stash list

# Re-apply stashed work and drop the stash
git stash pop

# Alternatively, inspect a stash without applying
git stash show -p stash@{0}
```

---

## 8. Tagging, Releases & Semantic Versioning

TeleMind follows [SemVer (Semantic Versioning 2.0.0)](https://semver.org/):
- **MAJOR (`X.0.0`)**: Incompatible API or A2UI specification breaking changes.
- **MINOR (`0.X.0`)**: Backward-compatible new features (e.g. new visualization components).
- **PATCH (`0.0.X`)**: Backward-compatible bug fixes and performance tuning.

### Creating an Annotated Release Tag

```bash
# Create an annotated signed tag on master
git tag -a v1.2.0 -m "Release v1.2.0: Link Analysis graph, custom CSV dataset upload, and Flyway V4"

# Push tag to remote
git push origin v1.2.0

# View tag details
git show v1.2.0
```

---

## 9. Security, Gitignore & Secret Management

### Strict Security Rules

> [!CAUTION]
> Never commit sensitive credentials, keys, or internal connection strings to Git!

The following files **MUST NEVER** be committed:
- `.env` (contains `OPENAI_API_KEY`, database passwords)
- Private SSH / SSL keys (`*.pem`, `*.key`)
- Local IDE directories (`.idea/`, `.vscode/`)
- Compiled binaries (`target/`, `dist/`, `*.jar`, `*.class`)
- Node dependencies (`node_modules/`)
- Log files (`*.log`)

If a secret is accidentally committed:
1. Invalidate and rotate the secret immediately.
2. Remove the secret from Git history using `git filter-repo` or `BFG Repo-Cleaner`.
3. Do not simply submit a second commit deleting the secret — it remains in Git history!

---

## 10. Developer Cheatsheet for TeleMind

| Action | Recommended Git Command |
|---|---|
| **Check repository status** | `git status -s` |
| **View pretty one-line commit log** | `git log --oneline --graph --decorate -n 15` |
| **View changes staged for commit** | `git diff --staged` |
| **Discard unstaged changes in a file** | `git restore <file>` |
| **Unstage a file while keeping changes** | `git restore --staged <file>` |
| **Amend last commit message** | `git commit --amend -m "new message"` |
| **Interactive rebase (squash last 3 commits)** | `git rebase -i HEAD~3` |
| **Discard all local changes (hard reset)** | `git reset --hard origin/master` |
| **Clean untracked files & directories** | `git clean -fd` |
| **Temporarily stash unstaged work** | `git stash -u` |

---

<p align="center"><b>TeleMind Engineering Standards • Google DeepMind & TeleMind Core Team</b></p>
