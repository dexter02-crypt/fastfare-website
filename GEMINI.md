# FastFare Logistics — Project Context

## Architecture
- Frontend: React 18 + TypeScript + Vite (SPA — never use Next.js patterns)
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Real-time: Socket.io (client + server)

## Frontend Stack
- Routing: React Router v6
- Styling: Tailwind CSS + shadcn/ui + Radix UI
- Animation: Framer Motion
- Icons: Lucide React
- Toasts: Sonner
- Forms: React Hook Form + Zod
- Server state: TanStack Query (useQuery / useMutation)
- Maps: @react-google-maps/api
- Charts: Recharts
- PDF: jsPDF + html2canvas
- Excel: xlsx
- Real-time: Socket.io-client

## Backend Stack
- Auth: JWT + bcryptjs
- Payments: Cashfree (Checkout + PG server-side API)
- Email: Nodemailer + Resend
- Uploads: Multer
- IDs: UUID
- Env: dotenv
- Security: Helmet + express-rate-limit + Zod (server-side validation)
- Logging: Winston
- Error tracking: Sentry Node

## Testing
- Frontend: Vitest + React Testing Library
- E2E: Playwright + Cypress
- Backend: Jest + Supertest
- Coverage: c8

## DevOps & Infra
- CI: GitHub Actions (lint + typecheck + test + build)
- Containers: Docker + Docker Compose (local) + Kubernetes/Helm (prod)
- Frontend deploy: Vercel or Netlify
- Backend deploy: DigitalOcean App Platform or AWS Elastic Beanstalk
- IaC: Terraform
- Package manager: npm (pnpm supported)
- Changelogs: Changesets

## Monitoring & Analytics
- Errors: Sentry (frontend + backend)
- Performance: Web Vitals + Lighthouse CI
- Logging: Winston + LogRocket
- Metrics: Prometheus + Grafana + Elastic Stack
- Analytics: GA4 + Mixpanel + Segment
- Feature flags: LaunchDarkly
- Cache: Redis

## Documentation
- UI components: Storybook
- API docs: Swagger/OpenAPI at /api-docs
- TypeScript docs: Typedoc

## Project Structure
- /frontend-ui — React SPA
- /backend — Express API

## Strict Rules (always follow)
- Never use Next.js patterns — no server components, no app router, no `use client`
- Always use shadcn/ui before building custom components
- Forms always use React Hook Form + Zod
- Server data always through TanStack Query
- Animations via Framer Motion, not raw CSS transitions
- Real-time via Socket.io events, never polling
- Payments exclusively through Cashfree (not Razorpay, not Stripe)
- All unique IDs via UUID
- TypeScript strict mode — never use `any`
- Input validated with Zod on both client AND server
- All errors tracked via Sentry

## Skill Library
~/.gemini/antigravity/skills/