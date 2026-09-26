# Architecture Decisions

## ADR 001 React Frontend Migration

**Decision:** Use React with Vite as the official frontend.

**Reason:** React supports clear CRUD pages, frontend and backend separation, and later AI pages while remaining simple enough for the course project. The existing Jinja interface is recognized as the working M1 and M2 prototype rather than an error.

## ADR 002 Flask REST API

**Decision:** Keep Flask and expose JSON or multipart REST endpoints through three simple blueprints.

**Reason:** Existing database and validation logic can be retained without introducing an additional backend framework or service layer.

## ADR 003 MySQL Data Store

**Decision:** Preserve the `ai_recruitment` database and its seven tables without migration.

**Reason:** The current schema supports the approved roadmap and has passed integration checks.

## ADR 004 Flask Session Authentication

**Decision:** Keep Flask Session rather than introduce JWT.

**Reason:** Session authentication already works, Vite proxy provides simple same-origin development requests, and JWT would add unnecessary complexity.

## ADR 005 Incremental Legacy Archive

**Decision:** Archive Jinja templates only after React Login, Jobs, and Candidates pass verification.

**Reason:** Incremental migration protects working functionality while preventing two active frontends from remaining after acceptance.

## ADR 006 Backend Only Gemini Access

**Decision:** A future Flask AI service will be the only component allowed to call Gemini.

**Reason:** This keeps the API key out of React and preserves the rule that AI is advisory only.

