import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, registerAndLogin } from "./helpers.js";

const doctor = (phone = "9812400001") => registerAndLogin(phone, "DOCTOR");
const patient = (phone = "9812400002") => registerAndLogin(phone, "PATIENT");
const pharmacy = (phone = "9812400003") => registerAndLogin(phone, "PHARMACY");

const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

describe("prescriptions", () => {
  it("doctor writes prescription, patient views it, pharmacy dispenses it", async () => {
    const [d, p, ph] = [await doctor(), await patient(), await pharmacy()];

    // Seed a medicine and pharmacy stock
    const med = await prisma.medicine.create({
      data: {
        name: "Amoxicillin 500mg",
        generic_name: "Amoxicillin",
        category: "CAPSULE",
        strength: "500 mg",
        price: 25.0,
      },
    });

    await prisma.pharmacyInventory.create({
      data: {
        pharmacy_id: ph.user.pharmacy_profile.id,
        medicine_id: med.id,
        batch_number: "BATCH-AMX-1",
        stock_quantity: 50,
        unit_price: 25.0,
        expiry_date: day(180),
        is_available: true,
      },
    });

    // Doctor searches medicine catalog
    const catalogRes = await api().get("/api/v1/medicines/catalog?q=Amoxicillin").set(d.headers);
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.length).toBeGreaterThan(0);
    const medId = catalogRes.body[0].id;

    // Doctor creates prescription
    const createRes = await api().post("/api/v1/prescriptions").set(d.headers).send({
      patient_id: p.user.patient_profile.id,
      diagnosis: "Acute Bacterial Bronchitis",
      instructions: "Complete the full 5-day course and rest",
      items: [
        {
          medicine_id: medId,
          dosage: "1 capsule",
          frequency: "Thrice daily after meals",
          duration_days: 5,
          quantity_prescribed: 15,
          instructions: "Take with plenty of water",
        },
      ],
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.prescription_number).toMatch(/^RX-NBH-/);
    expect(createRes.body.is_dispensed).toBe(false);
    expect(createRes.body.items).toHaveLength(1);
    expect(createRes.body.patient_name).toBe(p.user.full_name);

    const rxId = createRes.body.id;

    // Patient views their prescriptions
    const patientList = await api().get("/api/v1/prescriptions").set(p.headers);
    expect(patientList.status).toBe(200);
    expect(patientList.body.some((rx) => rx.id === rxId)).toBe(true);

    // Patient fetches single prescription
    const single = await api().get(`/api/v1/prescriptions/${rxId}`).set(p.headers);
    expect(single.status).toBe(200);
    expect(single.body.diagnosis).toBe("Acute Bacterial Bronchitis");

    // Non-doctor cannot create prescription
    const badCreate = await api().post("/api/v1/prescriptions").set(p.headers).send({
      patient_id: p.user.patient_profile.id,
      diagnosis: "Self diagnosis",
      items: [{ medicine_id: medId, dosage: "1 tab", frequency: "daily", duration_days: 3, quantity_prescribed: 3 }],
    });
    expect(badCreate.status).toBe(403);

    // Pharmacy dispenses the prescription
    const dispenseRes = await api().post(`/api/v1/prescriptions/${rxId}/dispense`).set(ph.headers);
    expect(dispenseRes.status).toBe(200);
    expect(dispenseRes.body.prescription.is_dispensed).toBe(true);

    // Check inventory was decremented (50 - 15 = 35)
    const updatedInv = await prisma.pharmacyInventory.findFirst({
      where: { pharmacy_id: ph.user.pharmacy_profile.id, medicine_id: med.id },
    });
    expect(updatedInv.stock_quantity).toBe(35);

    // Cannot dispense already dispensed prescription
    const repeatDispense = await api().post(`/api/v1/prescriptions/${rxId}/dispense`).set(ph.headers);
    expect(repeatDispense.status).toBe(400);
  });
});
