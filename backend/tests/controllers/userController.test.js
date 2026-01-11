import { jest } from "@jest/globals";
import { mockResponse } from "../utils/mockResponse.js";

process.env.JWT_SECRET = "testsecret";

/* ============================
   MOCKS (ES MODULE SAFE)
============================ */

jest.unstable_mockModule("../../models/userModel.js", () => {
  return {
    default: jest.fn(),
  };
});

jest.unstable_mockModule("bcrypt", () => {
  return {
    default: {
      genSalt: jest.fn(),
      hash: jest.fn(),
      compare: jest.fn(),
    },
  };
});

jest.unstable_mockModule("jsonwebtoken", () => {
  return {
    default: {
      sign: jest.fn(),
    },
  };
});

/* ============================
   IMPORT AFTER MOCKING
============================ */

const {
  registerUser,
  loginUser,
  getProfile,
} = await import("../../controllers/userController.js");

const userModel = (await import("../../models/userModel.js")).default;
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;

/* ============================
   TESTS
============================ */

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================
  // REGISTER USER
  // ==========================
  describe("registerUser", () => {
    it("fails if required fields are missing", async () => {
      const req = { body: { email: "test@test.com" } };
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Messing details",
      });
    });

    it("fails if email format is invalid", async () => {
      const req = {
        body: {
          name: "John",
          email: "invalid-email",
          password: "password123",
        },
      };
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Wrong email format",
      });
    });

    it("fails if password is weak", async () => {
      const req = {
        body: {
          name: "John",
          email: "john@test.com",
          password: "123",
        },
      };
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Enter a strong password",
      });
    });

    it("creates user and returns token", async () => {
      const req = {
        body: {
          name: "John",
          email: "john@test.com",
          password: "password123",
        },
      };
      const res = mockResponse();

      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");

      userModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "user123" }),
      }));

      jwt.sign.mockReturnValue("fake-token");

      await registerUser(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: "fake-token",
      });
    });
  });

  // ==========================
  // LOGIN USER
  // ==========================
  describe("loginUser", () => {
    it("fails if user does not exist", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);

      const req = {
        body: {
          email: "test@test.com",
          password: "password123",
        },
      };
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User doesn't existe",
      });
    });

    it("fails if password is incorrect", async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "user123",
        password: "hashedPassword",
      });

      bcrypt.compare.mockResolvedValue(false);

      const req = {
        body: {
          email: "test@test.com",
          password: "wrongpass",
        },
      };
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credetials",
      });
    });

    it("logs in successfully and returns token", async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "user123",
        password: "hashedPassword",
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("login-token");

      const req = {
        body: {
          email: "test@test.com",
          password: "password123",
        },
      };
      const res = mockResponse();

      await loginUser(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: "login-token",
      });
    });
  });

  // ==========================
  // GET PROFILE
  // ==========================
  describe("getProfile", () => {
    it("returns user profile without password", async () => {
      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "user123",
          name: "John",
          email: "john@test.com",
        }),
      });

      const req = { body: { userId: "user123" } };
      const res = mockResponse();

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        userData: {
          _id: "user123",
          name: "John",
          email: "john@test.com",
        },
      });
    });
  });
});
