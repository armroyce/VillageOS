# VillageOS — Village Administration SaaS

A dynamic, multi-tenant SaaS platform for village-level governance and administration. Digitizes resident records, tax collection, expense tracking, and audit trails for villages, panchayats, and NGOs.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VillageOS Platform                       │
├──────────────────────┬──────────────────────────────────────┤
│   Frontend (Vercel)  │       Backend API (Render)           │
│   React + Tailwind   │       Node.js + Express              │
│   i18next (EN/TA)    │       Sequelize ORM                  │
└──────────────────────┴──────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       control_db       db_village_01   db_village_02
    (global tenant      (Keezhakudi      (Melpakkam
      registry)           Village)        Village)
       [Neon.tech — database-per-tenant silo model]
```

**Middleware chain per request:** `verifyJWT → resolveTenant → connectTenantDB → checkPermission`

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL or Neon.tech account

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # starts on port 5173
```

### Database
Migrations and seeding run against Neon.tech automatically.
To run manually:
```bash
cd backend
npm run migrate:control     # control DB schema
npm run migrate:tenant      # both tenant DB schemas
npm run seed                # all seed data
```

## Environment Variables

| Variable | Description |
|---|---|
| `CONTROL_DB_URL` | PostgreSQL URL for the global control database |
| `TENANT_DB_VILLAGE_01` | Connection string for village_01 tenant DB |
| `TENANT_DB_VILLAGE_02` | Connection string for village_02 tenant DB |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `AES_SECRET_KEY` | AES-256 key for encrypting DB connection strings (exactly 32 chars) |
| `PORT` | Backend port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | CORS whitelist — your frontend origin |

## API Reference

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| POST | `/api/v1/auth/super-admin/login` | — | Super admin login |
| POST | `/api/v1/auth/login` | — | Village user login |
| GET | `/api/v1/auth/me` | JWT | Current user info |
| GET | `/api/v1/super/villages` | Super Admin | List all villages |
| POST | `/api/v1/super/villages` | Super Admin | Create village + provision DB |
| GET | `/api/v1/families` | FAMILY_VIEW | Paginated family list |
| POST | `/api/v1/families` | FAMILY_CREATE | Add family |
| GET | `/api/v1/families/:id/members` | FAMILY_VIEW | List members |
| POST | `/api/v1/tax` | TAX_CREATE | Collect tax, returns receipt |
| GET | `/api/v1/tax/dues` | TAX_VIEW | Families with unpaid tax |
| GET | `/api/v1/tax/summary` | TAX_VIEW | Collection summary by type |
| POST | `/api/v1/expenses` | EXPENSE_CREATE | Submit expense + bill upload |
| PUT | `/api/v1/expenses/:id/approve` | EXPENSE_APPROVE | Approve expense |
| GET | `/api/v1/reports/financial` | AUDIT_VIEW | Income/expense summary |
| GET | `/api/v1/reports/residents` | FAMILY_VIEW | Demographic summary |
| GET | `/api/v1/audit` | AUDIT_VIEW | Audit log |
| GET | `/api/v1/config` | JWT | Tenant branding config |

All responses: `{ success, data, message, pagination? }`
All errors: `{ success: false, error: { code, message, field? } }`

## Deployment

### Backend → Render.com
1. Push code to GitHub
2. Connect repo to [render.com](https://render.com) → New Web Service
3. `render.yaml` is already configured in `backend/`
4. Set all environment variables from `.env` in Render dashboard
5. Deploy

### Frontend → Vercel
```bash
cd frontend
npm run build
npx vercel --prod
# Set VITE_API_URL=https://your-render-url.onrender.com/api/v1
```

## Demo Credentials

| Role | URL | Email | Password |
|---|---|---|---|
| Super Admin | `/super/login` | root@villageos.com | Admin@123 |
| Village 01 Admin | `/login` (village-01) | admin@village01.com | Village@123 |
| Village 01 Clerk | `/login` (village-01) | clerk@village01.com | Clerk@123 |
| Village 02 Admin | `/login` (village-02) | admin@village02.com | Village@123 |

## Permissions

| Code | Description |
|---|---|
| `FAMILY_VIEW/CREATE/EDIT/DELETE` | Family and member management |
| `TAX_VIEW/CREATE` | Tax collection |
| `EXPENSE_VIEW/CREATE/APPROVE` | Expense management |
| `ROLE_VIEW/MANAGE` | Role and permission management |
| `USER_VIEW/CREATE/EDIT` | User management |
| `AUDIT_VIEW` | Audit logs and reports |
