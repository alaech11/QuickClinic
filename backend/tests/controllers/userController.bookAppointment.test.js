import { jest } from "@jest/globals";
import { mockResponse } from "../utils/mockResponse.js";

process.env.JWT_SECRET = "testsecret";

/* =========================
   MOCK MODULES (ESM)
========================= */

// appointmentModel → constructor + static methods
jest.unstable_mockModule("../../models/appointmentModel.js", () => ({
  default: jest.fn()
}));

// doctorModel
jest.unstable_mockModule("../../models/doctorModel.js", () => ({
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

// userModel
jest.unstable_mockModule("../../models/userModel.js", () => ({
  default: {
    findById: jest.fn()
  }
}));

/* =========================
   IMPORT AFTER MOCKING
========================= */
const appointmentModel = (await import("../../models/appointmentModel.js")).default;
const doctorModel = (await import("../../models/doctorModel.js")).default;
const userModel = (await import("../../models/userModel.js")).default;

const { bookAppointment } = await import("../../controllers/userController.js");

/* =========================
   TESTS
========================= */
describe("bookAppointment Controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    // 🔑 IMPORTANT FIX:
    // Every `new appointmentModel()` MUST have save()
    appointmentModel.mockImplementation(() => ({
  _id: "a1",                 // 👈 attach _id to instance
  save: jest.fn().mockResolvedValue(true)
}));


    // static method
    appointmentModel.findOne = jest.fn();
  });

  /* =========================
     1️⃣ Missing fields
  ========================= */
  it("should fail if required fields are missing", async () => {
    const req = { body: { userId: "u1" } };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Missing required fields"
    });
  });

  /* =========================
     2️⃣ User already booked
  ========================= */
  it("should fail if user already has appointment with same doctor", async () => {
    appointmentModel.findOne.mockResolvedValue({
      docData: { name: "Smith" }
    });

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "You already have an appointment with Dr. Smith. Only one appointment per doctor per day is allowed."
    });
  });

  /* =========================
     3️⃣ Doctor not found
  ========================= */
  it("should fail if doctor is not found", async () => {
    appointmentModel.findOne.mockResolvedValue(null);

    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Doctor not found"
    });
  });

  /* =========================
     4️⃣ Doctor not available
  ========================= */
  it("should fail if doctor is not available", async () => {
    appointmentModel.findOne.mockResolvedValue(null);

    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ available: false })
    });

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Doctor not available"
    });
  });

  /* =========================
     5️⃣ Slot already booked
  ========================= */
  it("should fail if time slot already booked", async () => {
    appointmentModel.findOne
      .mockResolvedValueOnce(null) // user check
      .mockResolvedValueOnce({}); // doctor slot check

    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        available: true,
        slots_booked: {}
      })
    });

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "This time slot is already booked. Please choose another time."
    });
  });

  /* =========================
     6️⃣ User not found
  ========================= */
  it("should fail if user is not found", async () => {
    appointmentModel.findOne.mockResolvedValue(null);

    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        available: true,
        slots_booked: {}
      })
    });

    userModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found"
    });
  });

  /* =========================
     7️⃣ SUCCESS CASE
  ========================= */
  it("should book appointment successfully", async () => {
    appointmentModel.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "d1",
        name: "Smith",
        available: true,
        fees: 500,
        slots_booked: {}
      })
    });

    userModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "u1",
        name: "John",
        email: "john@test.com"
      })
    });

    doctorModel.findByIdAndUpdate.mockResolvedValue(true);

    const req = {
      body: {
        userId: "u1",
        docId: "d1",
        slotDate: "2024-01-01",
        slotTime: "10:00"
      }
    };
    const res = mockResponse();

    await bookAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Appointment booked successfully!",
      appointmentId: "a1"
    });
  });
});
