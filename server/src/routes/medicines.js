import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles, requireUser } from "../lib/auth.js";
import { isoDate } from "../lib/serialize.js";

const include = { medicine: true, pharmacy: true };

const availability = (i) => ({
  inventory_id: i.id,
  medicine_id: i.medicine_id,
  medicine_name: i.medicine.name,
  generic_name: i.medicine.generic_name,
  strength: i.medicine.strength,
  pharmacy_id: i.pharmacy_id,
  pharmacy_name: i.pharmacy.pharmacy_name,
  pharmacy_address: i.pharmacy.address,
  pharmacy_village: i.pharmacy.village,
  pharmacy_phone: i.pharmacy.contact_phone,
  stock_quantity: i.stock_quantity,
  unit_price: Number(i.unit_price), // Decimal in DB; JSON number for clients
  expiry_date: isoDate(i.expiry_date),
  updated_at: i.updated_at,
});

const inventoryItem = (i) => ({
  ...availability(i), batch_number: i.batch_number, reorder_level: i.reorder_level, is_available: i.is_available,
});

const todayUtcMidnight = () => new Date(`${new Date().toLocaleDateString("en-CA")}T00:00:00Z`);

export const medicinesRouter = Router();

/** Catalogue lookup for prescribing: id + name + strength. */
medicinesRouter.get("/", requireUser, async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().max(100).default("") }), req.query);
  const match = { contains: q, mode: "insensitive" };
  const medicines = await prisma.medicine.findMany({
    where: q ? { OR: [{ name: match }, { generic_name: match }, { brand_name: match }] } : {},
    select: { id: true, name: true, generic_name: true, strength: true, category: true },
    orderBy: [{ name: "asc" }, { strength: "asc" }],
    take: 20,
  });
  res.json(medicines);
});

/** Public / Doctor: search medicine catalog. */
medicinesRouter.get("/catalog", async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : "";
  const match = q ? { contains: q, mode: "insensitive" } : undefined;
  const where = match ? { OR: [{ name: match }, { generic_name: match }, { brand_name: match }] } : {};
  const items = await prisma.medicine.findMany({
    where,
    orderBy: { name: "asc" },
    take: 100,
  });
  res.json(items);
});

/** Public: which Nabha pharmacies have this medicine in stock right now (cheapest first). */
medicinesRouter.get("/availability", async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().min(2).max(100) }), req.query);
  const match = { contains: q, mode: "insensitive" };
  const items = await prisma.pharmacyInventory.findMany({
    where: {
      medicine: { OR: [{ name: match }, { generic_name: match }, { brand_name: match }] },
      is_available: true,
      stock_quantity: { gt: 0 },
      expiry_date: { gte: todayUtcMidnight() },
    },
    include,
    orderBy: [{ medicine: { name: "asc" } }, { unit_price: "asc" }],
    take: 50,
  });
  res.json(items.map(availability));
});

const ownPharmacy = (user) => {
  if (!user.pharmacy) throw new HttpError(400, "Pharmacy profile missing");
  return user.pharmacy;
};

/** Pharmacy's own stock, lowest quantity first so reorders surface. */
medicinesRouter.get("/inventory", ...requireRoles("PHARMACY"), async (req, res) => {
  const items = await prisma.pharmacyInventory.findMany({
    where: { pharmacy_id: ownPharmacy(req.user).id },
    include,
    orderBy: [{ stock_quantity: "asc" }, { id: "asc" }],
  });
  res.json(items.map(inventoryItem));
});

/** Pharmacy sets the current quantity for one of its batches. */
medicinesRouter.patch("/inventory/:id", ...requireRoles("PHARMACY"), async (req, res) => {
  const { stock_quantity } = parse(z.object({ stock_quantity: z.number().int().min(0).max(100000) }), req.body);
  const pharmacy = ownPharmacy(req.user);
  const item = await prisma.pharmacyInventory.findUnique({ where: { id: Number(req.params.id) || 0 } });
  if (!item || item.pharmacy_id !== pharmacy.id) throw new HttpError(404, "Inventory item not found");

  const updated = await prisma.pharmacyInventory.update({
    where: { id: item.id },
    data: { stock_quantity, is_available: stock_quantity > 0 },
    include,
  });
  res.json(inventoryItem(updated));
});

/** 
 * GET /api/v1/medicines/near-expiry
 * Query near-expiry inventory batches across Nabha pharmacies with risk stratification.
 */
medicinesRouter.get("/near-expiry", async (req, res) => {
  const schema = z.object({
    days: z.coerce.number().int().min(1).max(365).default(60),
    pharmacy_id: z.coerce.number().int().optional(),
    village: z.string().trim().optional(),
    medicine_id: z.coerce.number().int().optional(),
  });
  const { days, pharmacy_id, village, medicine_id } = parse(schema, req.query);

  const today = todayUtcMidnight();
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);

  const where = {
    is_available: true,
    stock_quantity: { gt: 0 },
    expiry_date: {
      gte: today,
      lte: cutoff,
    },
    ...(pharmacy_id ? { pharmacy_id } : {}),
    ...(medicine_id ? { medicine_id } : {}),
    ...(village ? { pharmacy: { village: { equals: village, mode: "insensitive" } } } : {}),
  };

  const batches = await prisma.pharmacyInventory.findMany({
    where,
    include,
    orderBy: [{ expiry_date: "asc" }, { stock_quantity: "desc" }],
  });

  const items = batches.map((b) => {
    const expDate = new Date(b.expiry_date);
    const diffMs = expDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let riskLevel = "MONITORED";
    if (daysUntilExpiry <= 30) riskLevel = "CRITICAL_EXPIRY";
    else if (daysUntilExpiry <= 60) riskLevel = "HIGH_EXPIRY_RISK";
    else if (daysUntilExpiry <= 90) riskLevel = "MODERATE_RISK";

    const surplusQuantity = Math.max(0, b.stock_quantity - b.reorder_level);
    const potentialLossInr = Number(b.unit_price) * b.stock_quantity;

    return {
      ...inventoryItem(b),
      days_until_expiry: daysUntilExpiry,
      risk_level: riskLevel,
      surplus_quantity: surplusQuantity,
      potential_loss_inr: potentialLossInr,
      is_surplus: surplusQuantity > 0,
    };
  });

  const totalSurplus = items.reduce((acc, curr) => acc + curr.surplus_quantity, 0);
  const totalValueAtRisk = items.reduce((acc, curr) => acc + curr.potential_loss_inr, 0);

  res.json({
    count: items.length,
    days_threshold: days,
    total_surplus_units: totalSurplus,
    total_value_at_risk_inr: totalValueAtRisk,
    batches: items,
  });
});

/**
 * POST /api/v1/medicines/redistribute/auto-match
 * Smart matching algorithm pairing surplus near-expiry stock with pharmacies facing stock-outs.
 */
medicinesRouter.post("/redistribute/auto-match", async (req, res) => {
  const schema = z.object({
    days: z.coerce.number().int().min(1).max(365).default(60),
    auto_create: z.boolean().default(false),
  });
  const { days, auto_create } = parse(schema, req.body || {});

  const today = todayUtcMidnight();
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);

  // 1. Find all batches with surplus stock expiring within cutoff
  const surplusBatches = await prisma.pharmacyInventory.findMany({
    where: {
      is_available: true,
      expiry_date: { gte: today, lte: cutoff },
    },
    include,
    orderBy: { expiry_date: "asc" },
  });

  const eligibleSurplus = surplusBatches
    .map((b) => ({
      ...b,
      surplus: b.stock_quantity - b.reorder_level,
    }))
    .filter((b) => b.surplus > 0);

  if (eligibleSurplus.length === 0) {
    return res.json({
      total_matches: 0,
      potential_units_salvaged: 0,
      estimated_value_saved_inr: 0,
      matches: [],
    });
  }

  // 2. For each medicine in surplus, find pharmacies where stock <= reorder_level
  const matches = [];
  let totalSalvaged = 0;
  let totalValueSaved = 0;

  for (const surplusItem of eligibleSurplus) {
    let availableToTransfer = surplusItem.surplus;

    const needyInventories = await prisma.pharmacyInventory.findMany({
      where: {
        medicine_id: surplusItem.medicine_id,
        pharmacy_id: { not: surplusItem.pharmacy_id },
      },
      include,
      orderBy: { stock_quantity: "asc" },
    });

    for (const targetInv of needyInventories) {
      if (availableToTransfer <= 0) break;
      const deficit = targetInv.reorder_level - targetInv.stock_quantity;
      if (deficit <= 0) continue;

      const transferQty = Math.min(availableToTransfer, deficit);
      availableToTransfer -= transferQty;
      totalSalvaged += transferQty;
      totalValueSaved += transferQty * Number(surplusItem.unit_price);

      let createdTransfer = null;
      if (auto_create) {
        const transferNumber = `TRF-NBH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        createdTransfer = await prisma.stockTransferRequest.create({
          data: {
            transfer_number: transferNumber,
            source_pharmacy_id: surplusItem.pharmacy_id,
            target_pharmacy_id: targetInv.pharmacy_id,
            medicine_id: surplusItem.medicine_id,
            batch_number: surplusItem.batch_number,
            quantity: transferQty,
            expiry_date: surplusItem.expiry_date,
            status: "PENDING",
            reason: "SURPLUS_NEAR_EXPIRY_REBALANCE",
            notes: `Auto-matched rebalancing of ${transferQty} units from ${surplusItem.pharmacy.pharmacy_name} to ${targetInv.pharmacy.pharmacy_name}`,
          },
        });
      }

      matches.push({
        source_pharmacy: {
          id: surplusItem.pharmacy.id,
          name: surplusItem.pharmacy.pharmacy_name,
          village: surplusItem.pharmacy.village,
          phone: surplusItem.pharmacy.contact_phone,
        },
        target_pharmacy: {
          id: targetInv.pharmacy.id,
          name: targetInv.pharmacy.pharmacy_name,
          village: targetInv.pharmacy.village,
          phone: targetInv.pharmacy.contact_phone,
        },
        medicine: {
          id: surplusItem.medicine.id,
          name: surplusItem.medicine.name,
          generic_name: surplusItem.medicine.generic_name,
          strength: surplusItem.medicine.strength,
        },
        batch_number: surplusItem.batch_number,
        expiry_date: isoDate(surplusItem.expiry_date),
        source_current_stock: surplusItem.stock_quantity,
        target_current_stock: targetInv.stock_quantity,
        target_reorder_level: targetInv.reorder_level,
        recommended_transfer_quantity: transferQty,
        estimated_value_inr: transferQty * Number(surplusItem.unit_price),
        created_transfer_id: createdTransfer?.id ?? null,
        created_transfer_number: createdTransfer?.transfer_number ?? null,
      });
    }
  }

  res.json({
    total_matches: matches.length,
    potential_units_salvaged: totalSalvaged,
    estimated_value_saved_inr: totalValueSaved,
    matches,
  });
});

/**
 * GET /api/v1/medicines/transfers/summary
 * Aggregate metrics on inter-pharmacy transfers and inventory rebalancing.
 */
medicinesRouter.get("/transfers/summary", async (req, res) => {
  const [total, pending, approved, inTransit, completed, nearExpiryBatches] = await Promise.all([
    prisma.stockTransferRequest.count(),
    prisma.stockTransferRequest.count({ where: { status: "PENDING" } }),
    prisma.stockTransferRequest.count({ where: { status: "APPROVED" } }),
    prisma.stockTransferRequest.count({ where: { status: "IN_TRANSIT" } }),
    prisma.stockTransferRequest.count({ where: { status: "COMPLETED" } }),
    prisma.pharmacyInventory.count({
      where: {
        is_available: true,
        stock_quantity: { gt: 0 },
        expiry_date: {
          gte: todayUtcMidnight(),
          lte: (() => {
            const d = todayUtcMidnight();
            d.setUTCDate(d.getUTCDate() + 60);
            return d;
          })(),
        },
      },
    }),
  ]);

  const completedTransfers = await prisma.stockTransferRequest.findMany({
    where: { status: "COMPLETED" },
    include: { medicine: true },
  });

  const totalUnitsRebalanced = completedTransfers.reduce((acc, t) => acc + t.quantity, 0);
  const estimatedWastagePreventedInr = completedTransfers.reduce(
    (acc, t) => acc + t.quantity * Number(t.medicine.price),
    0
  );

  res.json({
    total_transfers: total,
    pending_transfers: pending,
    approved_transfers: approved,
    in_transit_transfers: inTransit,
    completed_transfers: completed,
    near_expiry_batches_count: nearExpiryBatches,
    total_units_rebalanced: totalUnitsRebalanced,
    estimated_wastage_prevented_inr: estimatedWastagePreventedInr,
  });
});

/**
 * POST /api/v1/medicines/transfers
 * Create a new stock rebalancing transfer order.
 */
medicinesRouter.post("/transfers", async (req, res) => {
  const schema = z.object({
    source_pharmacy_id: z.number().int().positive(),
    target_pharmacy_id: z.number().int().positive(),
    medicine_id: z.number().int().positive(),
    batch_number: z.string().trim().min(1).max(50),
    quantity: z.number().int().positive().max(10000),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().max(255).optional(),
    notes: z.string().trim().optional(),
  });
  const data = parse(schema, req.body);

  if (data.source_pharmacy_id === data.target_pharmacy_id) {
    throw new HttpError(400, "Source and target pharmacy cannot be the same");
  }

  const sourceInventory = await prisma.pharmacyInventory.findFirst({
    where: {
      pharmacy_id: data.source_pharmacy_id,
      medicine_id: data.medicine_id,
      batch_number: data.batch_number,
    },
  });

  if (!sourceInventory) {
    throw new HttpError(404, "Source inventory batch not found");
  }

  if (sourceInventory.stock_quantity < data.quantity) {
    throw new HttpError(400, `Insufficient stock in source batch. Available: ${sourceInventory.stock_quantity}, requested: ${data.quantity}`);
  }

  const transferNumber = `TRF-NBH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const transfer = await prisma.stockTransferRequest.create({
    data: {
      transfer_number: transferNumber,
      source_pharmacy_id: data.source_pharmacy_id,
      target_pharmacy_id: data.target_pharmacy_id,
      medicine_id: data.medicine_id,
      batch_number: data.batch_number,
      quantity: data.quantity,
      expiry_date: new Date(`${data.expiry_date}T00:00:00Z`),
      status: "PENDING",
      reason: data.reason || "SURPLUS_NEAR_EXPIRY_REBALANCE",
      notes: data.notes,
    },
    include: {
      source_pharmacy: true,
      target_pharmacy: true,
      medicine: true,
    },
  });

  res.status(201).json(transfer);
});

/**
 * GET /api/v1/medicines/transfers
 * List stock transfers with filtering by status and pharmacies.
 */
medicinesRouter.get("/transfers", async (req, res) => {
  const schema = z.object({
    status: z.enum(["PENDING", "APPROVED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]).optional(),
    source_pharmacy_id: z.coerce.number().int().optional(),
    target_pharmacy_id: z.coerce.number().int().optional(),
    medicine_id: z.coerce.number().int().optional(),
  });
  const filters = parse(schema, req.query);

  const transfers = await prisma.stockTransferRequest.findMany({
    where: filters,
    include: {
      source_pharmacy: true,
      target_pharmacy: true,
      medicine: true,
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  res.json(transfers);
});

/**
 * GET /api/v1/medicines/transfers/:id
 * Lookup a single transfer request by id or transfer_number.
 */
medicinesRouter.get("/transfers/:id", async (req, res) => {
  const param = req.params.id;
  const numId = Number(param);
  const where = isNaN(numId) ? { transfer_number: param } : { id: numId };

  const transfer = await prisma.stockTransferRequest.findUnique({
    where,
    include: {
      source_pharmacy: true,
      target_pharmacy: true,
      medicine: true,
    },
  });

  if (!transfer) throw new HttpError(404, "Stock transfer request not found");
  res.json(transfer);
});

/**
 * PATCH /api/v1/medicines/transfers/:id/status
 * Update transfer status. On COMPLETED, atomically transfers stock between pharmacies.
 */
medicinesRouter.patch("/transfers/:id/status", async (req, res) => {
  const schema = z.object({
    status: z.enum(["PENDING", "APPROVED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]),
    notes: z.string().trim().optional(),
  });
  const { status, notes } = parse(schema, req.body);
  const id = Number(req.params.id) || 0;

  const current = await prisma.stockTransferRequest.findUnique({
    where: { id },
    include: {
      source_pharmacy: true,
      target_pharmacy: true,
      medicine: true,
    },
  });

  if (!current) throw new HttpError(404, "Stock transfer request not found");

  if (current.status === "COMPLETED" || current.status === "CANCELLED") {
    throw new HttpError(400, `Cannot modify transfer with terminal status ${current.status}`);
  }

  // If transitioning to COMPLETED, perform atomic inventory transaction
  if (status === "COMPLETED") {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Verify and deduct from source
      const sourceBatch = await tx.pharmacyInventory.findFirst({
        where: {
          pharmacy_id: current.source_pharmacy_id,
          medicine_id: current.medicine_id,
          batch_number: current.batch_number,
        },
      });

      if (!sourceBatch || sourceBatch.stock_quantity < current.quantity) {
        throw new HttpError(400, "Source batch has insufficient stock to complete transfer");
      }

      await tx.pharmacyInventory.update({
        where: { id: sourceBatch.id },
        data: {
          stock_quantity: sourceBatch.stock_quantity - current.quantity,
          is_available: sourceBatch.stock_quantity - current.quantity > 0,
        },
      });

      // 2. Find or create in target
      const targetBatch = await tx.pharmacyInventory.findFirst({
        where: {
          pharmacy_id: current.target_pharmacy_id,
          medicine_id: current.medicine_id,
          batch_number: current.batch_number,
        },
      });

      if (targetBatch) {
        await tx.pharmacyInventory.update({
          where: { id: targetBatch.id },
          data: {
            stock_quantity: targetBatch.stock_quantity + current.quantity,
            is_available: true,
          },
        });
      } else {
        await tx.pharmacyInventory.create({
          data: {
            pharmacy_id: current.target_pharmacy_id,
            medicine_id: current.medicine_id,
            batch_number: current.batch_number,
            stock_quantity: current.quantity,
            reorder_level: 20,
            unit_price: sourceBatch.unit_price,
            expiry_date: current.expiry_date,
            is_available: true,
          },
        });
      }

      // 3. Mark transfer COMPLETED
      return await tx.stockTransferRequest.update({
        where: { id: current.id },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
          notes: notes || current.notes,
        },
        include: {
          source_pharmacy: true,
          target_pharmacy: true,
          medicine: true,
        },
      });
    });

    return res.json(updated);
  }

  // Standard non-terminal status update (APPROVED, IN_TRANSIT, CANCELLED)
  const updated = await prisma.stockTransferRequest.update({
    where: { id: current.id },
    data: {
      status,
      approved_at: status === "APPROVED" ? new Date() : current.approved_at,
      notes: notes || current.notes,
    },
    include: {
      source_pharmacy: true,
      target_pharmacy: true,
      medicine: true,
    },
  });

  res.json(updated);
});
