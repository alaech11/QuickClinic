import { jest } from "@jest/globals";
import { mockResponse } from "../utils/mockResponse.js";

/* =========================
   ENV
========================= */
process.env.JWT_SECRET = "testsecret";
process.env.ADMIN_EMAIL = "admin@test.com";
process.env.ADMIN_PASSWORD = "admin123";

/* =========================
   MOCK MODELS
========================= */
jest.unstable_mockModule("../../models/doctorModel.js", () => ({
  default: {
    find: jest.fn()
  }
}));

jest.unstable_mockModule("../../models/appointmentModel.js", () => ({
  default: {
    find: jest.fn()
  }
}));

jest.unstable_mockModule("../../models/userModel.js", () => ({
  default: {
    find: jest.fn()
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
const userModel = (await import("../../models/userModel.js")).default;
const jwt = (await import("jsonwebtoken")).default;

const {
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  adminDashboard
} = await import("../../controllers/adminController.js");

/* =========================
   TESTS
========================= */
describe("Admin Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =========================
     loginAdmin
  ========================= */
  describe("loginAdmin", () => {
    it("should login admin with correct credentials", async () => {
      jwt.sign.mockReturnValue("admin-token");

      const req = {
        body: {
          email: "admin@test.com",
          password: "admin123"
        }
      };
      const res = mockResponse();

      await loginAdmin(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: "admin-token"
      });
    });

    it("should fail with wrong credentials", async () => {
      const req = {
        body: {
          email: "wrong@test.com",
          password: "wrongpass"
        }
      };
      const res = mockResponse();

      await loginAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "invalid credentials"
      });
    });
  });

  /* =========================
     allDoctors
  ========================= */
  describe("allDoctors", () => {
    it("should return list of doctors", async () => {
      doctorModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { name: "Dr A" },
          { name: "Dr B" }
        ])
      });

      const req = {};
      const res = mockResponse();

      await allDoctors(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        doctors: [
          { name: "Dr A" },
          { name: "Dr B" }
        ]
      });
    });
  });

  /* =========================
     appointmentsAdmin
  ========================= */
  describe("appointmentsAdmin", () => {
    it("should return all appointments", async () => {
      appointmentModel.find.mockResolvedValue([
        { _id: "a1" },
        { _id: "a2" }
      ]);

      const req = {};
      const res = mockResponse();

      await appointmentsAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        appointments: [
          { _id: "a1" },
          { _id: "a2" }
        ]
      });
    });
  });

  /* =========================
     adminDashboard
  ========================= */
  describe("adminDashboard", () => {
    it("should return dashboard data", async () => {
      doctorModel.find.mockResolvedValue([{},{},{}]); // 3 doctors
      userModel.find.mockResolvedValue([{},{},{} ,{}]); // 4 users

      appointmentModel.find.mockResolvedValue([
        { isCompleted: true, amount: 100 },
        { isCompleted: false, amount: 200 },
        { isCompleted: true, amount: 300 }
      ]);

      const req = {};
      const res = mockResponse();

      await adminDashboard(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        dashData: {
          doctors: 3,
          appointments: 3,
          completedAppointments: 2,
          earnings: 400,
          patients: 4,
          latestAppointment: expect.any(Array)
        }
      });
    });
  });
});
