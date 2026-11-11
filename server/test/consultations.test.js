import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, registerAndLogin } from "./helpers.js";

const doctor = (phone = "9812500001") => registerAndLogin(phone, "DOCTOR");
const patient = (phone = "9812500002") => registerAndLogin(phone, "PATIENT");
const stranger = (phone = "9812500003") => registerAndLogin(phone, "PATIENT");

const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

describe("consultations", () => {
  it("initiates room, updates to low-bandwidth fallback, exchanges signals, and completes with rating", async () => {
    const [d, p, other] = [await doctor(), await patient(), await stranger()];

    // Create a teleconsultation appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointment_number: `APT-NBH-TELE-${Date.now().toString().slice(-6)}`,
        doctor_id: d.user.doctor_profile.id,
        patient_id: p.user.patient_profile.id,
        appointment_date: day(1),
        appointment_time: "10:00 AM",
        appointment_type: "TELECONSULTATION",
        status: "SCHEDULED",
        symptom_summary: "Fever and sore throat for 3 days",
      },
    });

    // 1. Doctor initiates consultation
    const initRes = await api().post("/api/v1/consultations").set(d.headers).send({
      appointment_id: appointment.id,
      consultation_type: "VIDEO",
    });
    expect(initRes.status).toBe(201);
    expect(initRes.body.room_id).toContain("sehatsetu-nabha-room");
    expect(initRes.body.status).toBe("INITIATED");
    expect(initRes.body.low_bandwidth_fallback).toBe(false);
    expect(initRes.body.ice_servers.length).toBeGreaterThan(0);
    const roomId = initRes.body.room_id;

    // 2. Patient joins / retrieves room
    const getRes = await api().get(`/api/v1/consultations/${roomId}`).set(p.headers);
    expect(getRes.status).toBe(200);
    expect(getRes.body.doctor.full_name).toBeTruthy();
    expect(getRes.body.patient.full_name).toBeTruthy();

    // Unauthorized stranger cannot access
    const unauthRes = await api().get(`/api/v1/consultations/${roomId}`).set(other.headers);
    expect(unauthRes.status).toBe(403);

    // 3. Mark status CONNECTED
    const connectRes = await api().patch(`/api/v1/consultations/${roomId}/status`).set(d.headers).send({
      status: "CONNECTED",
    });
    expect(connectRes.status).toBe(200);
    expect(connectRes.body.status).toBe("CONNECTED");
    expect(connectRes.body.start_time).toBeTruthy();

    // 4. Low-bandwidth fallback: Nabha rural village 2G/3G connection drop
    const fallbackRes = await api().patch(`/api/v1/consultations/${roomId}/fallback`).set(p.headers).send({
      low_bandwidth_fallback: true,
      consultation_type: "AUDIO",
      reason: "Rural 2G connection detected in village sector",
    });
    expect(fallbackRes.status).toBe(200);
    expect(fallbackRes.body.low_bandwidth_fallback).toBe(true);
    expect(fallbackRes.body.consultation_type).toBe("AUDIO");

    // 5. WebRTC Signaling: Send and receive SDP offer / answer
    const offerRes = await api().post(`/api/v1/consultations/${roomId}/signal`).set(d.headers).send({
      type: "offer",
      data: { sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n" },
    });
    expect(offerRes.status).toBe(201);

    // Patient polls signals and receives the offer
    const signalsRes = await api().get(`/api/v1/consultations/${roomId}/signals?since=0`).set(p.headers);
    expect(signalsRes.status).toBe(200);
    expect(signalsRes.body.some((s) => s.type === "offer")).toBe(true);

    // 6. In-Call Chat
    const chatSend = await api().post(`/api/v1/consultations/${roomId}/chat`).set(p.headers).send({
      message: "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਡਾਕਟਰ ਸਾਹਿਬ, ਆਵਾਜ਼ ਸਾਫ਼ ਸੁਣ ਰਹੀ ਹੈ",
    });
    expect(chatSend.status).toBe(201);

    const chatList = await api().get(`/api/v1/consultations/${roomId}/chat`).set(d.headers);
    expect(chatList.status).toBe(200);
    expect(chatList.body.length).toBeGreaterThan(0);
    expect(chatList.body[0].message).toContain("ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ");

    // 7. Complete consultation with rating & clinical notes
    const completeRes = await api().patch(`/api/v1/consultations/${roomId}/status`).set(d.headers).send({
      status: "COMPLETED",
      doctor_notes: "Advised warm saline gargles, hydration, and paracetamol for viral pharyngitis.",
      quality_rating: 5,
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe("COMPLETED");
    expect(completeRes.body.quality_rating).toBe(5);
    expect(completeRes.body.doctor_notes).toContain("warm saline gargles");
    expect(completeRes.body.end_time).toBeTruthy();

    // Verify appointment status automatically transitioned to COMPLETED
    const aptInDb = await prisma.appointment.findUnique({ where: { id: appointment.id } });
    expect(aptInDb.status).toBe("COMPLETED");
  });
});
