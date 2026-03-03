-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'RETAILER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RetailerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CalculatorStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('SYNCED', 'DETACHED');

-- CreateEnum
CREATE TYPE "FabricPriceTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5', 'TIER_6');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_SHIPPING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('PENDING', 'CUTTING', 'SEWING', 'FILLING', 'QUALITY_CHECK', 'COMPLETE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('SHAPE_IMAGE', 'FOAM_IMAGE', 'FABRIC_IMAGE', 'LOGO', 'DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "retailerId" TEXT,
    "invitationToken" TEXT,
    "invitationExpires" TIMESTAMP(3),
    "invitedById" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailers" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" JSONB,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#3b82f6',
    "secondaryColor" TEXT DEFAULT '#1e40af',
    "markupType" "MarkupType" NOT NULL DEFAULT 'PERCENTAGE',
    "markupValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "RetailerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "status" "CalculatorStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "calculators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_calculator_assignments" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "calculatorId" TEXT NOT NULL,
    "assignmentType" "AssignmentType" NOT NULL DEFAULT 'SYNCED',
    "customPricing" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailer_calculator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "calculatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "priceTier" "FabricPriceTier" NOT NULL DEFAULT 'TIER_1',
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerAddress" JSONB,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "markupAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "convertedToOrderId" TEXT,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "foamType" TEXT NOT NULL,
    "fabricId" TEXT,
    "fabricCode" TEXT NOT NULL,
    "fabricName" TEXT,
    "zipperPosition" TEXT NOT NULL,
    "piping" TEXT NOT NULL,
    "ties" TEXT NOT NULL,
    "fabricMeters" DECIMAL(10,4) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "baseSewingCost" DECIMAL(10,2) NOT NULL,
    "baseFiberfillCost" DECIMAL(10,2) NOT NULL,
    "basePipingCost" DECIMAL(10,2) NOT NULL,
    "baseTiesCost" DECIMAL(10,2) NOT NULL,
    "baseFabricCost" DECIMAL(10,2) NOT NULL,
    "baseSubtotal" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "instructions" TEXT,
    "attachmentUrls" TEXT[],
    "preview3DUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerAddress" JSONB,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "markupAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "productionNotes" TEXT,
    "shippingAddress" JSONB,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "foamType" TEXT NOT NULL,
    "fabricCode" TEXT NOT NULL,
    "zipperPosition" TEXT NOT NULL,
    "piping" TEXT NOT NULL,
    "ties" TEXT NOT NULL,
    "fabricMeters" DECIMAL(10,4) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "instructions" TEXT,
    "attachmentUrls" TEXT[],
    "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'PENDING',
    "productionNotes" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "tags" TEXT[],
    "metadata" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_retailerId_key" ON "users"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_invitationToken_key" ON "users"("invitationToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_retailerId_idx" ON "users"("retailerId");

-- CreateIndex
CREATE INDEX "users_invitationToken_idx" ON "users"("invitationToken");

-- CreateIndex
CREATE UNIQUE INDEX "retailers_email_key" ON "retailers"("email");

-- CreateIndex
CREATE INDEX "retailers_status_idx" ON "retailers"("status");

-- CreateIndex
CREATE INDEX "retailers_email_idx" ON "retailers"("email");

-- CreateIndex
CREATE INDEX "calculators_status_idx" ON "calculators"("status");

-- CreateIndex
CREATE INDEX "calculators_isMaster_idx" ON "calculators"("isMaster");

-- CreateIndex
CREATE INDEX "retailer_calculator_assignments_retailerId_idx" ON "retailer_calculator_assignments"("retailerId");

-- CreateIndex
CREATE INDEX "retailer_calculator_assignments_calculatorId_idx" ON "retailer_calculator_assignments"("calculatorId");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_calculator_assignments_retailerId_calculatorId_key" ON "retailer_calculator_assignments"("retailerId", "calculatorId");

-- CreateIndex
CREATE INDEX "fabric_brands_calculatorId_idx" ON "fabric_brands"("calculatorId");

-- CreateIndex
CREATE INDEX "fabrics_brandId_idx" ON "fabrics"("brandId");

-- CreateIndex
CREATE INDEX "fabrics_code_idx" ON "fabrics"("code");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_convertedToOrderId_key" ON "quotes"("convertedToOrderId");

-- CreateIndex
CREATE INDEX "quotes_retailerId_idx" ON "quotes"("retailerId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_createdAt_idx" ON "quotes"("createdAt");

-- CreateIndex
CREATE INDEX "quotes_quoteNumber_idx" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_quoteId_key" ON "orders"("quoteId");

-- CreateIndex
CREATE INDEX "orders_retailerId_idx" ON "orders"("retailerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productionStatus_idx" ON "order_items"("productionStatus");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_tags_idx" ON "assets"("tags");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_calculator_assignments" ADD CONSTRAINT "retailer_calculator_assignments_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_calculator_assignments" ADD CONSTRAINT "retailer_calculator_assignments_calculatorId_fkey" FOREIGN KEY ("calculatorId") REFERENCES "calculators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_brands" ADD CONSTRAINT "fabric_brands_calculatorId_fkey" FOREIGN KEY ("calculatorId") REFERENCES "calculators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "fabric_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
