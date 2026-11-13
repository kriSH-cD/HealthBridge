import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { requireRoles } from "../lib/auth.js";
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
