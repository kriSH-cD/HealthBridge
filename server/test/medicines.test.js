import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, registerAndLogin } from "./helpers.js";

const day = (offset) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + offset); return d; };

/** Two pharmacies, each stocking Paracetamol; returns their logins and inventory rows. */
async function setup() {
  const med = await prisma.medicine.create({ data: { name: "Paracetamol", generic_name: "Paracetamol", strength: "500 mg" } });
  const pharmacies = [];
  for (const [i, phone] of ["9812300011", "9812300012"].entries()) {
    const ph = await registerAndLogin(phone, "PHARMACY");
    const rows = await Promise.all([10, 0, 5].map((qty, j) => prisma.pharmacyInventory.create({ data: {
      pharmacy_id: ph.user.pharmacy_profile.id, medicine_id: med.id, batch_number: `B${i}${j}`,
      stock_quantity: qty, unit_price: 12 - i - j, expiry_date: j === 2 ? day(-1) : day(30),
    } })));
    pharmacies.push({ ...ph, rows });
  }
  return pharmacies;
}

describe("medicines", () => {
  it("availability lists only in-stock, unexpired batches, cheapest first", async () => {
    const [a, b] = await setup();
    const res = await api().get("/api/v1/medicines/availability?q=paracet");
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.inventory_id).sort()).toEqual([a.rows[0].id, b.rows[0].id].sort());
    const prices = res.body.map((r) => r.unit_price);
    expect(prices).toEqual([...prices].sort((x, y) => x - y));
    expect(res.body[0]).toMatchObject({ medicine_name: "Paracetamol", strength: "500 mg" });
    expect((await api().get("/api/v1/medicines/availability?q=a")).status).toBe(422);
  });

  it("pharmacy updates only its own stock", async () => {
    const [a, b] = await setup();
    const patient = await registerAndLogin("9812300013", "PATIENT");

    const mine = (await api().get("/api/v1/medicines/inventory").set(a.headers)).body;
    expect(new Set(mine.map((r) => r.pharmacy_id))).toEqual(new Set([a.user.pharmacy_profile.id]));
    expect(mine[0].stock_quantity).toBe(0); // lowest first

    const target = a.rows[0].id;
    const res = await api().patch(`/api/v1/medicines/inventory/${target}`).set(a.headers).send({ stock_quantity: 0 });
    expect(res.status).toBe(200);
    expect(res.body.is_available).toBe(false);

    expect((await api().patch(`/api/v1/medicines/inventory/${b.rows[0].id}`).set(a.headers).send({ stock_quantity: 5 })).status).toBe(404);
    expect((await api().patch(`/api/v1/medicines/inventory/${target}`).set(a.headers).send({ stock_quantity: -1 })).status).toBe(422);
    expect((await api().get("/api/v1/medicines/inventory").set(patient.headers)).status).toBe(403);
  });
});
