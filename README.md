# Staff Management System — Monorepo

A multi-service, multi-language monorepo for the Staff Management System. This repository contains backend services, web and mobile clients, automation tests, and lambda utilities.

---

## Contents

- `asp_net/` — ASP.NET Core Web API (C#)
- `auth-service/` — Java service (Spring Boot)
- `flutter_app/` — Flutter mobile app
- `go-service/` — Go REST service
- `laravel/` — Laravel (PHP) app
- `react-app/` — React web frontend
- `lambda/` — Node.js AWS Lambda utilities
- `selenium-ui-automation/`, `appium_flutter_test/` — UI automation tests
- `tests/` and Test projects across subfolders

---

## Technologies Used 🔧

### asp_net/ (StaffManagement)

- **Language & Framework:** C#, ASP.NET Core (Target: `net9.0`)
- **ORM & DB:** Entity Framework Core, Npgsql (PostgreSQL provider)
- **Background Jobs:** Hangfire
- **Other:** AutoMapper, CsvHelper
- **Testing:** xUnit (see `StaffManagement.Tests/`)
- Files to check: `StaffManagement/StaffManagement.csproj`

### auth-service/

- **Language & Build:** Java 21, Maven (wrapper `mvnw` present)
- **Framework:** Spring Boot (parent version in `pom.xml` ≈ 3.5.x)
- **DB & Migrations:** PostgreSQL, Flyway
- **Security / Web:** Spring Security, OAuth2 resource server / client, Thymeleaf
- **Metrics / Monitoring:** Micrometer + Prometheus
- **Testing & Reporting:** JUnit 5, Mockito, Rest Assured, Allure, JaCoCo
- Files to check: `auth-service/pom.xml`

### flutter_app/

- **Language & SDK:** Flutter (Dart) — environment `sdk: ^3.9.2` in `pubspec.yaml`
- **Auth / Backend integration:** Amplify / Cognito
- **Other libs:** http, intl, file_picker
- Testing: `flutter_test` / `flutter_driver`
- Files to check: `flutter_app/pubspec.yaml`

### go-service/

- **Language & Framework:** Go (module `go 1.25.5`), Gin web framework
- **Common deps:** pgx, dotenv, validator, etc.
- Files to check: `go-service/go.mod`

### laravel/

- **Language & Framework:** PHP ^8.2, Laravel ^12.0
- **Storage / Assets:** Flysystem S3 adapter available
- **Dev & Tools:** Composer scripts, Sail, Pint, PHPUnit
- Files to check: `laravel/composer.json`

### react-app/

- **Language & Tooling:** React (v19, TypeScript), `react-scripts`
- **UI:** MUI (Material UI)
- **Networking:** axios
- **Testing / Automation:** Mocha + Mochawesome for test suites, Selenium WebDriver for UI tests
- Files to check: `react-app/package.json`

### lambda/

- **Runtime:** Node.js (ES Modules) — `type: "module"` in `package.json`
- **Dependencies:** `pg` for Postgres, Jest for unit tests
- Files to check: `lambda/package.json` and `lambda/*.mjs`

### Automation & Test Suites

- **Selenium** and **Mocha** for UI automation present under `selenium-ui-automation/` and test scripts in `react-app`.
- **Appium** tests available under `flutter_app/appium_flutter_test/`.

---

## How to find exact versions and manifests 📁

Look in each subproject's manifest file for exact version pins and configurations:

- Java: `auth-service/pom.xml`
- .NET: `asp_net/StaffManagement/StaffManagement.csproj`
- Node: `*/package.json`
- Flutter: `flutter_app/pubspec.yaml`
- Go: `go-service/go.mod`
- PHP/Laravel: `laravel/composer.json`
- React: `react-app/package.json`

---

## Quick start & common commands ▶️

(Use the subproject directories)

- ASP.NET Core

  - dotnet build / run: `cd asp_net/StaffManagement && dotnet run`
  - tests: `dotnet test StaffManagement.Tests`

- Java (auth-service)

  - mvn wrapper: `cd auth-service && ./mvnw spring-boot:run` (on Windows use `mvnw.cmd`)
  - tests & reports: `./mvnw test` (Allure / JaCoCo configured in `pom.xml`)

- Flutter

  - `cd flutter_app && flutter pub get && flutter run`

- Go

  - `cd go-service && go run ./cmd/...` or build with `go build` as appropriate

- Laravel

  - `cd laravel && composer install && php artisan serve`

- React

  - `cd react-app && npm install && npm start`
  - UI test scripts: `npm run test:...` (many mocha suites defined)

- Lambda (Node)
  - `cd lambda` and run tests with `npm test`

---

## Notes & Tips 💡

- This is a polyglot monorepo; use each subproject's manifest for env and version details.
- Many services expect PostgreSQL; check each service's configuration for DB connection settings.
- CI/infra specifics are not centralized here — check project docs or pipeline configs if present.

---

## Contributing & Contact

If you'd like me to add more details (setup guides, env var lists, example `.env` files, or CI instructions), open an issue or request it here and I can add it.

---

_Generated summary of technologies across the repository._
