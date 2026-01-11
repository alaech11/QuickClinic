import { jest } from "@jest/globals";
import { mockResponse } from "../utils/mockResponse.js";

process.env.JWT_SECRET = "testsecret";

/* =========================
   MOCK MODELS & LIBS (ESM)
========================= */

jest.unstable_mockModule("../../models/doctorModel.js", () => ({
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.unstable_mockModule("../../models/appointmentModel.js", () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    compare: jest.fn()
  }
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn()
  }
}));

/* =========================
   IMPORT AFTER MOCKING
========================= */

const doctorModel = (await import("../../models/doctorModel.js")).default;
const appointmentModel = (await import("../../models/appointmentModel.js")).default;
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;

const {
  changeAvailablity,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile
} = await import("../../controllers/doctorController.js");

/* =========================
   TESTS
========================= */

describe("Doctor Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // changeAvailablity
  // ========================
  it("should toggle doctor availability", async () => {
    doctorModel.findById.mockResolvedValue({ available: true });
    doctorModel.findByIdAndUpdate.mockResolvedValue(true);

    const req = { body: { docId: "d1" } };
    const res = mockResponse();

    await changeAvailablity(req, res);

    expect(doctorModel.findByIdAndUpdate).toHaveBeenCalledWith("d1", {
      available: false
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Availablity Changed"
    });
  });

  // ========================
  // doctorList
  // ========================
  it("should return doctor list", async () => {
    doctorModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ name: "Dr A" }])
    });

    const req = {};
    const res = mockResponse();

    await doctorList(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      doctors: [{ name: "Dr A" }]
    });
  });

  // ========================
  // loginDoctor
  // ========================
  it("should fail login if doctor not found", async () => {
    doctorModel.findOne.mockResolvedValue(null);

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockResponse();

    await loginDoctor(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid credentials"
    });
  });

  it("should login doctor successfully", async () => {
    doctorModel.findOne.mockResolvedValue({
      _id: "d1",
      password: "hashed"
    });

    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("doctor-token");

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockResponse();

    await loginDoctor(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: "doctor-token"
    });
  });

  // ========================
  // appointmentsDoctor
  // ========================
  it("should return doctor appointments", async () => {
    appointmentModel.find.mockResolvedValue([{ _id: "a1" }]);

    const req = { body: { docId: "d1" } };
    const res = mockResponse();

    await appointmentsDoctor(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      appointments: [{ _id: "a1" }]
    });
  });

  // ========================
  // appointmentComplete
  // ========================
  it("should mark appointment complete", async () => {
    appointmentModel.findById.mockResolvedValue({
      docId: "d1"
    });

    appointmentModel.findByIdAndUpdate.mockResolvedValue(true);

    const req = { body: { docId: "d1", appointmentId: "a1" } };
    const res = mockResponse();

    await appointmentComplete(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Appointment Completed"
    });
  });

  // ========================
  // appointmentCancel
  // ========================
  it("should cancel appointment", async () => {
    appointmentModel.findById.mockResolvedValue({
      docId: "d1",
      slotDate: "2024-01-01",
      slotTime: "10:00"
    });

    doctorModel.findById.mockResolvedValue({
      slots_booked: {
        "2024-01-01": ["10:00"]
      },
      save: jest.fn()
    });

    appointmentModel.findByIdAndUpdate.mockResolvedValue(true);

    const req = { body: { docId: "d1", appointmentId: "a1" } };
    const res = mockResponse();

    await appointmentCancel(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Appointment Cancelled"
    });
  });

  // ========================
  // doctorDashboard
  // ========================
  it("should return dashboard data", async () => {
    appointmentModel.find.mockResolvedValue([
      { isCompleted: true, userId: "u1" },
      { isCompleted: false, userId: "u2" }
    ]);

    const req = { body: { docId: "d1" } };
    const res = mockResponse();

    await doctorDashboard(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      dashData: expect.objectContaining({
        completedAppointments: 1,
        appointments: 2,
        patients: 2
      })
    });
  });

  // ========================
  // doctorProfile
  // ========================
  it("should return doctor profile", async () => {
    doctorModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ name: "Dr A" })
    });

    const req = { body: { docId: "d1" } };
    const res = mockResponse();

    await doctorProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      profileData: { name: "Dr A" }
    });
  });

  // ========================
  // updateDoctorProfile
  // ========================
  it("should update doctor profile", async () => {
    doctorModel.findByIdAndUpdate.mockResolvedValue(true);

    const req = {
      body: {
        docId: "d1",
        fees: 500,
        address: "NY",
        available: true
      }
    };
    const res = mockResponse();

    await updateDoctorProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Profile updated"
    });
  });
});