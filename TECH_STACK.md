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
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for rapid UI development.
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed, accessible, and customizable components built on top of Radix UI and Tailwind.
- **[Radix UI](https://www.radix-ui.com/)**: Unstyled, accessible component primitives.
- **[Framer Motion](https://www.framer.com/motion/)**: Production-ready animation library for fluid transitions and micro-interactions.
- **[Lucide React](https://lucide.dev/)**: Clean, consistent icon set.
- **[Sonner](https://sonner.emilkowal.ski/)**: Toast notifications.

### Data Management & Forms
- **[React Hook Form](https://react-hook-form.com/)**: Performant, flexible, and extensible forms with easy-to-use validation.
- **[Zod](https://zod.dev/)**: TypeScript-first schema declaration and validation (used with React Hook Form).
- **[TanStack Query](https://tanstack.com/query/latest)** (React Query): Powerful asynchronous state management for server state.

### Specialized Integrations
- **[@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)**: Google Maps integration for address selection and live tracking.
- **[Recharts](https://recharts.org/)**: Composable charting library for dashboard analytics.
- **[Socket.io-client](https://socket.io/)**: Real-time bidirectional event-based communication.
- **[jsPDF](https://artskydj.github.io/jsPDF/) & [html2canvas]**: Client-side PDF generation for shipping labels and invoices.
- **[xlsx](https://sheetjs.com/)**: Excel spreadsheet parsing and generation for bulk operations.

---

## ⚙️ Backend (Server-Side)
The backend is built in the `backend` directory, serving as the central nervous system for authentication, data processing, and third-party integrations.

### Core
- **[Node.js](https://nodejs.org/)**: JavaScript runtime environment.
- **[Express.js](https://expressjs.com/)**: Fast, unopinionated, minimalist web framework.

### Database & ODM
- **[MongoDB](https://www.mongodb.com/)**: NoSQL database for flexible schema design (Users, Shipments, Webhooks, etc.).
- **[Mongoose](https://mongoosejs.com/)**: Elegant MongoDB object modeling (ODM).

### Authentication & Security
- **[JWT (JSON Web Tokens)](https://jwt.io/)**: Stateless, secure authentication strategy.
- **[Bcrypt.js](https://www.npmjs.com/package/bcryptjs)**: Password hashing.
- **[CORS](https://expressjs.com/en/resources/middleware/cors.html)**: Cross-Origin Resource Sharing middleware.

### Real-time Communication
- **[Socket.io](https://socket.io/)**: Server-side WebSockets for real-time fleet updates and shipment status broadcasts.

### Integrations & Utilities
- **[Razorpay](https://razorpay.com/)**: Payment gateway integration for wallet recharges and online shipment creation.
- **[Nodemailer](https://nodemailer.com/) & [Resend](https://resend.com/)**: Transactional email sending (OTP verification, shipment updates).
- **[Multer](https://github.com/expressjs/multer)**: Middleware for handling `multipart/form-data` (file uploads).
- **[UUID](https://github.com/uuidjs/uuid)**: Generating unique identifiers (e.g., AWB numbers).
- **[dotenv](https://github.com/motdotla/dotenv)**: Environment variable management.
