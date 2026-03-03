# Cushion Quoting & Management System

A Multi-Tenant SaaS platform for cushion manufacturers to manage retailers and provide custom quoting tools with 3D visualization.

## Features

### Admin Dashboard (Command Center)
- **Retailer Management**: CRUD interface to create/disable retailer accounts (max 30 retailers)
- **Master Calculator Builder**: Create and manage calculator templates with drag-and-drop feel
- **Asset Management**: High-resolution image uploads for fabrics, shapes, foam types
- **Assignment Logic**: Assign calculators to retailers with SYNC/DETACH options
- **Global Tracking**: Real-time stats on quotes, orders, and active users

### Retailer Dashboard (Sales Interface)
- **Custom UI**: Minimalist, mobile-responsive design for on-site quoting
- **Cushion Calculator**: 9-step configuration process with real-time pricing
- **Price Manipulation**: Apply markup (percentage or fixed) to base prices
- **PDF Engine**: Generate professional quotes hiding base costs
- **Order Tracking**: Convert quotes to orders and track status

### Calculator Features
1. **Product Type Selection** (Sofa, Pillow, Outdoor)
2. **Shape Selection** (Rectangle, Round, Triangle, Trapezium, T Cushion, L Shape)
3. **Dimensions** with auto-calculated fabric meters
4. **Foam/Fill Type** (High Density Foam, Dry Fast Foam, Fiber Fill, Covers Only)
5. **Fabric Selection** with brand tabs and hover preview
6. **Zipper Position** (Long Side, Short Side, No Zipper)
7. **Piping Option** (Piping, No Piping)
8. **Ties Option** (No ties, 2 Side, 4 Side, 4 Corner, 6 Side, 8 Side)
9. **Special Instructions** with file uploads
10. **Customer Details** with validation

### 3D Preview
- Real-time 3D visualization of cushion shapes
- Interactive rotation (drag to rotate)
- Zoom controls
- Auto-rotation toggle
- Fabric color application
- Feature visualization (piping, ties)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with invitation-only system
- **File Storage**: AWS S3 or Supabase Storage
- **PDF Generation**: pdf-lib
- **Monorepo**: TurboRepo

## Project Structure

```
cushion-saas/
├── apps/
│   └── web/                    # Next.js 14 application
├── packages/
│   ├── calculator-engine/      # Core pricing calculations
│   ├── shared-types/           # TypeScript type definitions
│   └── database/               # Prisma schema and client
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cushion-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the database:
```bash
docker-compose up -d db redis
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Default Login

After running the seed script, you can log in with:
- **Admin**: admin@cushionsaas.com / admin123
- **Retailer**: (create via admin dashboard)

## Calculator Engine

The calculator engine implements all the pricing formulas:

### Sewing Cost
```
0-24"    → $7.50 per unit
25-48"   → $11.25 per unit
49-72"   → $15.00 per unit
73-96"   → $18.75 per unit
97-120"  → $21.25 per unit
```

### Fabric Meters Calculation
Each shape has its own formula for calculating fabric meters based on dimensions.

### Foam/Fill Cost
Tiered pricing based on max dimension and foam type:
- High Density Foam
- Dry Fast Foam
- Fiber Fill
- Covers Only

### Fabric Pricing Tiers
- Tier 1: $21.89375/m
- Tier 2: $24.0125/m
- Tier 3: $25.425/m
- Tier 4: $33.90/m
- Tier 5: $36.725/m
- Tier 6: $73.45/m

## Authentication Flow

1. **Admin creates retailer** via dashboard
2. **Invitation email sent** with unique token
3. **Retailer accepts invitation** and sets password
4. **Retailer logs in** and accesses custom calculator

## API Routes

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/retailers` - List retailers
- `POST /api/admin/retailers` - Create retailer
- `PUT /api/admin/retailers/:id` - Update retailer
- `DELETE /api/admin/retailers/:id` - Soft delete retailer

### Calculators
- `GET /api/calculators` - List calculators
- `POST /api/calculators` - Create calculator
- `PUT /api/calculators/:id` - Update calculator
- `POST /api/calculators/:id/assign` - Assign to retailer

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id/pdf` - Generate PDF
- `POST /api/quotes/:id/convert` - Convert to order

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status

## Database Schema

### Key Tables
- `users` - Authentication and user data
- `retailers` - Retailer profiles and markup settings
- `calculators` - Calculator templates
- `fabric_brands` - Fabric brand categories
- `fabrics` - Individual fabrics with pricing tiers
- `quotes` - Customer quotes
- `quote_items` - Individual line items
- `orders` - Converted orders
- `order_items` - Order line items with production status

## Deployment

### Docker Deployment

1. Build and start all services:
```bash
docker-compose up -d
```

2. Run migrations:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="secure-random-string"
NEXTAUTH_URL="https://your-domain.com"
AWS_S3_BUCKET="your-bucket"
AWS_REGION="us-east-1"
RESEND_API_KEY="your-api-key"
```

## Development

### Adding a New Shape

1. Add shape to `CushionShape` type in `shared-types`
2. Add dimension calculation in `calculator-engine`
3. Add 3D rendering component in `Preview3D.tsx`
4. Add shape image to config

### Adding a New Fabric

1. Add fabric to database via admin dashboard
2. Assign price tier (1-6)
3. Upload fabric image
4. Fabric automatically appears in selector

## Testing

```bash
# Run all tests
npm test

# Run specific package tests
npm run test --workspace=@cushion-saas/calculator-engine
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For support, email support@cushionsaas.com or open an issue on GitHub.
