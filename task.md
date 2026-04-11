# FastFare Implementation Tasks

## Change 1 — Minimum Order Value Enforcement (₹150)
- [x] Backend: Add Zod server-side validation in orders.js POST route
- [x] Backend: Return HTTP 422 on validation failure
- [x] Backend: Log rejected attempts via Winston
- [x] Frontend: Add orderValue schema in schemas/orderSchema.ts
- [x] Frontend: Disable Proceed button when total < 150
- [x] Frontend: Show destructive Alert when value < 150

## Change 2 — Order Stages + Pipeline UI
- [x] Backend: Add orderStage enum to Order.js model
- [x] Backend: Add orderType enum to Order.js model  
- [x] Backend: Add orderHistory array to Order.js model
- [x] Backend: PATCH /api/orders/:id/stage endpoint exists
- [x] Frontend: StagePipeline.tsx component
- [x] Frontend: OrderStageCard.tsx component
- [x] Frontend: ConfirmStageDialog.tsx component
- [x] Frontend: OrderTimelineAccordion.tsx component

## Change 3 — Partner Settlement Integration
- [x] Backend: Settlement.js model exists with all fields
- [x] Backend: Auto-create settlement on delivery
- [x] Backend: GET /api/partner/settlements endpoint exists

## Change 4 — Real-time Order Lifecycle
- [x] Backend: Socket.io service exists
- [x] Frontend: useOrderSocket.ts hook created
- [x] Frontend: Real-time event handlers implemented

## Change 5 — Order Integration on User Dashboard
- [x] Backend: GET /api/orders/summary endpoint
- [x] Backend: GET /api/orders/recent endpoint
- [x] Frontend: DashboardOrdersSummary.tsx component
- [x] Frontend: OrderStatCards.tsx component
- [x] Frontend: RecentOrdersList.tsx component

## Change 6 — Transactional Email Notifications
- [x] Backend: emailService/index.js exists with templates

## Change 7 — Reports Section Placeholders
- [x] Frontend: ReportPlaceholderCard.tsx component
- [x] Frontend: Reports.tsx includes GST and COD placeholders