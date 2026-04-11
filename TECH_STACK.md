# FastFare Logistics - Tech Stack

This document outlines the core technologies, frameworks, and libraries used to build the FastFare Logistics web application.

## 🏗 Overall Architecture
FastFare is built as a modern full-stack web application with a decoupled architecture:
- **Frontend**: A Single Page Application (SPA) built with React and TypeScript, running on Vite.
- **Backend**: A RESTful API built with Node.js and Express.
- **Database**: MongoDB (NoSQL) for flexible, document-based data storage.
- **Real-time**: WebSockets using Socket.io for live tracking and instant notifications.

---

## 💻 Frontend (Client-Side)
The frontend is built in the `frontend-ui` directory, focusing on a responsive, highly kinetic, and accessible user interface.

### Core
- **[React](https://react.dev/) (v18)**: Core UI library.
- **[TypeScript](https://www.typescriptlang.org/)**: Static typing for safer code.
- **[Vite](https://vitejs.dev/)**: Extremely fast development server and bundler.
- **[React Router](https://reactrouter.com/) (v6)**: Client-side routing.

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility‑first CSS framework for rapid UI development.
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed, accessible, and customizable components built on top of Radix UI and Tailwind.
- **[Radix UI](https://www.radix-ui.com/)**: Unstyled, accessible component primitives.
- **[Framer Motion](https://www.framer.com/motion/)**: Production‑ready animation library for fluid transitions and micro‑interactions.
- **[Lucide React](https://lucide.dev/)**: Clean, consistent icon set.
- **[Sonner](https://sonner.emilkowal.ski/)**: Toast notifications.

### Data Management & Forms
- **[React Hook Form](https://react-hook-form.com/)**: Performant, flexible, and extensible forms with easy‑to‑use validation.
- **[Zod](https://zod.dev/)**: TypeScript‑first schema declaration and validation (used with React Hook Form).
- **[TanStack Query](https://tanstack.com/query/latest) (React Query)**: Powerful asynchronous state management for server state.

### Specialized Integrations
- **[@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)**: Google Maps integration for address selection and live tracking.
- **[Recharts](https://recharts.org/)**: Composable charting library for dashboard analytics.
- **[Socket.io-client](https://socket.io/)**: Real‑time bidirectional event‑based communication.
- **[jsPDF](https://artskydj.github.io/jsPDF/) & [html2canvas]**: Client‑side PDF generation for shipping labels and invoices.
- **[xlsx](https://sheetjs.com/)**: Excel spreadsheet parsing and generation for bulk operations.

---

## ⚙️ Backend (Server-Side)
The backend is built in the `backend` directory, serving as the central nervous system for authentication, data processing, and third‑party integrations.

### Core
- **[Node.js](https://nodejs.org/)**: JavaScript runtime environment.
- **[Express.js](https://expressjs.com/)**: Fast, unopinionated, minimalist web framework.

### Database & ODM
- **[MongoDB](https://www.mongodb.com/)**: NoSQL database for flexible schema design (Users, Shipments, Webhooks, etc.).
- **[Mongoose](https://mongoosejs.com/)**: Elegant MongoDB object modeling (ODM).

### Authentication & Security
- **[JWT (JSON Web Tokens)](https://jwt.io/)**: Stateless, secure authentication strategy.
- **[Bcrypt.js](https://www.npmjs.com/package/bcryptjs)**: Password hashing.
- **[CORS](https://expressjs.com/en/resources/middleware/cors.html)**: Cross‑Origin Resource Sharing middleware.

### Real‑time Communication
- **[Socket.io](https://socket.io/)**: Server‑side WebSockets for real‑time fleet updates and shipment status broadcasts.

### Integrations & Utilities
- **[Cashfree Payments](https://www.cashfree.com/)**: Payment gateway integration for wallet recharges, order payments, and payout processing. Supports both **Cashfree Checkout** (hosted payment page) and **Cashfree PG** (server‑side API) for flexible integration.
- **[Nodemailer](https://nodemailer.com/) & [Resend](https://resend.com/)**: Transactional email sending (OTP verification, shipment updates).
- **[Multer](https://github.com/expressjs/multer)**: Middleware for handling `multipart/form-data` (file uploads).
- **[UUID](https://github.com/uuidjs/uuid)**: Generating unique identifiers (e.g., AWB numbers).
- **[dotenv](https://github.com/motdotla/dotenv)**: Environment variable management.

---

## 🧪 Testing
- **Unit & Integration**: **Vitest** (fast Vite‑native test runner) + **React Testing Library** for component tests.
- **End‑to‑End**: **Playwright** for cross‑browser UI testing and **Cypress** for more complex workflow tests.
- **Backend**: **Jest** + **Supertest** for API endpoint testing.
- **Coverage**: **c8** (Istanbul) integrated with CI to enforce minimum coverage thresholds.

---

## 🚀 CI/CD & DevOps
- **Version Control**: GitHub (branch‑based workflow with Pull Requests).
- **CI**: **GitHub Actions** pipelines for linting, type‑checking, testing, and building.
- **Containerisation**: **Docker** for both frontend and backend services; Dockerfiles are provided in each service directory.
- **Orchestration**: **Docker Compose** for local development; **Kubernetes** (via Helm charts) for production scaling.
- **Hosting**:
  - Frontend deployed on **Vercel** (edge‑optimized CDN) or **Netlify**.
  - Backend hosted on **DigitalOcean App Platform** or **AWS Elastic Beanstalk**.
- **Infrastructure as Code**: **Terraform** scripts for provisioning cloud resources (VPC, DB clusters, load balancers).

---

## 📦 Package Management
- **npm** as the primary package manager; **pnpm** is supported for workspace‑level monorepo optimisations.
- **Changesets** for automated changelog generation and version bumping.

---

## 📊 Monitoring & Logging
- **Error Tracking**: **Sentry** (frontend) and **Sentry Node** (backend) for real‑time error monitoring.
- **Performance**: **Web Vitals** collection via custom hooks; **Lighthouse** CI integration.
- **Logging**: **Winston** (backend) with log rotation; **LogRocket** for client‑side session replay.
- **Metrics**: **Prometheus** + **Grafana** dashboards for server metrics; **Elastic Stack** for log aggregation and search.

---

## 📈 Analytics & Business Intelligence
- **Google Analytics** (GA4) for page‑view and conversion tracking.
- **Mixpanel** for event‑driven user behaviour analysis.
- **Segment** as a unified data pipeline to forward events to downstream tools (e.g., Amplitude, Snowflake).

---

## 🔐 Security & Compliance
- **Helmet**: Secure HTTP headers.
- **Rate Limiting**: **express-rate-limit** to mitigate brute‑force attacks.
- **Input Validation**: **Zod** schemas on both client and server side.
- **Content Security Policy (CSP)**: Strict CSP via Helmet.
- **OWASP** best practices enforced throughout the codebase.
- **Static Code Analysis**: **ESLint** (with `eslint-plugin-security`) and **SonarQube** for continuous security scanning.

---

## 📚 Documentation & API Contracts
- **Storybook**: Interactive UI component library with live examples and accessibility checks.
- **Typedoc**: Auto‑generated TypeScript API documentation for shared utilities.
- **Swagger / OpenAPI**: Backend API contracts documented with **swagger-jsdoc** and served at `/api-docs`.
- **README & CONTRIBUTING**: Comprehensive guides for onboarding, development workflow, and contribution standards.

---

## 🌐 Deployment & Environment Management
- **Environment Variables**: Managed via **dotenv** locally and **GitHub Secrets** / **Vercel Environment Variables** in CI.
- **Zero‑Downtime Deployments**: Rolling updates via Kubernetes Deployments.
- **Feature Flags**: **LaunchDarkly** (or custom flag service) for progressive rollouts.
- **Cache Layer**: **Redis** for session storage and rate‑limit counters.

---

*All versions are pinned in `package.json` and kept up‑to‑date via Dependabot.*
