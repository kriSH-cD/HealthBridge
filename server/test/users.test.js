import { describe, expect, it } from "vitest";
import { api, registerAndLogin } from "./helpers.js";

describe("users directory", () => {
  it("filters doctors by village and specialization", async () => {
    await registerAndLogin("9812300001", "DOCTOR", { village: "Duladdi",
      doctor_data: { specialization: "Pediatrics", license_number: "PB-1", hospital_name: "CHC Duladdi" } });
    await registerAndLogin("9812300002", "DOCTOR", { village: "Alhoran" });

    expect((await api().get("/api/v1/users/doctors")).body).toHaveLength(2);
    const duladdi = (await api().get("/api/v1/users/doctors?village=dulad")).body;
    expect(duladdi.map((d) => d.village)).toEqual(["Duladdi"]);
    const peds = (await api().get("/api/v1/users/doctors?specialization=pediat")).body;
    expect(peds.map((d) => d.doctor_profile.specialization)).toEqual(["Pediatrics"]);
  });

  it("restricts the patient list to clinical roles", async () => {
    const patient = await registerAndLogin("9812345680", "PATIENT");
    const doctor = await registerAndLogin("9812345681", "DOCTOR");

    const denied = await api().get("/api/v1/users/patients").set(patient.headers);
    expect(denied.status).toBe(403);
    expect(denied.body.detail).toContain("Access forbidden");

    const ok = await api().get("/api/v1/users/patients").set(doctor.headers);
    expect(ok.status).toBe(200);
    expect(ok.body.map((u) => u.phone)).toEqual(["9812345680"]);
  });
});
