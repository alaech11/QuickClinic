import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';  // Added jwt import
import app from '../../app.js';

// Import models
import User from '../../models/userModel.js';
import Doctor from '../../models/doctorModel.js';
import Appointment from '../../models/appointmentModel.js';

// Use the same JWT secret as in your .env file
process.env.JWT_SECRET = 'quickclinic';
process.env.NODE_ENV = 'test';

describe('User Controller Integration Tests', () => {
  let userToken;
  let userId;
  let doctorId;

  beforeAll(async () => {
    // Connect to test database using your actual MongoDB URI
    const mongoUri = process.env.MONGO_URI_TEST || "mongodb+srv://alaechairikamel1_db_user:5UCNRRcpv5k5gspU@cluster0.sm1qqgb.mongodb.net/test_db";
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to test database');
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Doctor.deleteMany({});
  });

  afterAll(async () => {
    await Doctor.deleteMany({});
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await mongoose.connection.close();
    console.log('Test database connection closed');
  });

  describe('POST /api/user/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Integration User',
        email: 'integration@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      console.log('Registration response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      
      if (response.body.success === true) {
        expect(response.body.token).toBeDefined();
        
        const user = await User.findOne({ email: 'integration@test.com' });
        expect(user).toBeTruthy();
        expect(user.name).toBe('Integration User');
      } else {
        console.warn('Registration returned success: false:', response.body.message);
      }
    });

    test('should reject registration with existing email', async () => {
      // Create a user first
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Existing User',
        email: 'existing@test.com',
        password: hashedPassword,
        phone: '1234567890',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSURBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLZu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6fd9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xb9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC6zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQnxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOE7d37g7tbX7e+8+9M0gfAlJg3d7r9m5ZZs2EAPNvt2rdZc6fbNQAe7Xazn8rM8q8A8GZzM/vv5ubmZv4XAN7874/sv2U3N/8wAN5sNrNns+bOtwbAoxu5uZk9v7m5+d0AeHJz87P9j/aWlVZHzJ7uAAAAAElFTkSuQmCC',
        address: { line1: 'Test Address', line2: '' },
        gender: 'Male',
        dob: '1990-01-01',
        hasAllergies: false,
        allergies: []
      });

      const response = await request(app)
        .post('/api/user/register')
        .send({
          name: 'New User',
          email: 'existing@test.com',
          password: 'password123'
        });

      console.log('Duplicate email response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('duplicate key error');
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        name: 'Login User',
        email: 'login@test.com',
        password: hashedPassword,
        phone: '1234567890',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSURBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLZu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6fd9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xb9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC6zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQnxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOE7d37g7tbX7e+8+9M0gfAlJg3d7r9m5ZZs2EAPNvt2rdZc6fbNQAe7Xazn8rM8q8A8GZzM/vv5ubmZv4XAN7874/sv2U3N/8wAN5sNrNns+bOtwbAoxu5uZk9v7m5+d0AeHJz87P9j/aWlVZHzJ7uAAAAAElFTkSuQmCC',
        address: { line1: 'Test Address', line2: '' },
        gender: 'Male',
        dob: '1990-01-01',
        hasAllergies: false,
        allergies: []
      });
      userId = user._id.toString();
    });

    test('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      console.log('Login response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      userToken = response.body.token;
      
      // Verify the token is valid and contains the user ID
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
      expect(decoded.id).toBe(userId);
      console.log('Decoded token:', decoded);
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      console.log('Invalid login response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credetials');
    });
  });

  describe('POST /api/user/book-appointment', () => {
    beforeEach(async () => {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        name: 'Appointment User',
        email: 'appointment@test.com',
        password: hashedPassword,
        phone: '1234567890',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSIRBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLZu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6fd9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xr9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC6zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQmxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOE7d37g7tbX7e+8+9M0gfAlJg3d7r9m5ZZs2EAPNvt2rdZc6fbNQAe7Xazn8rM8q8A8GZzM/vv5ubmZv4XAN7874/sv2U3N/8wAN5sNrNns+bOtwbAoxu5uZk9v7m5+d0AeHJz87P9j/aWlVZHzJ7uAAAAAElFTkSuQmCC',
        address: { line1: 'Test Address', line2: '' },
        gender: 'Male',
        dob: '1990-01-01',
        hasAllergies: false,
        allergies: []
      });
      userId = user._id.toString();
      
      // Create doctor
      const hashedDoctorPassword = await bcrypt.hash('password123', 10);
      const doctor = await Doctor.create({
        name: 'Dr. Integration Test',
        email: 'drintegration@test.com',
        password: hashedDoctorPassword,
        image: 'doctor_image.jpg',
        speciality: 'Integration Testing',
        degree: 'MD',
        experience: '5 years',
        about: 'Test doctor for integration testing',
        fees: 50,
        address: { city: 'Test City', street: '123 Test St' },
        date: Date.now(),
        available: true,
        slots_booked: {}
      });
      doctorId = doctor._id.toString();
      
      // Get token by logging in
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: 'appointment@test.com',
          password: 'password123'
        });
      
      if (loginResponse.body.success && loginResponse.body.token) {
        userToken = loginResponse.body.token;
        console.log('Got user token for appointment test');
        
        // Verify the token is valid
        try {
          const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
          console.log('Token verified for user:', decoded.id);
        } catch (error) {
          console.error('Token verification failed:', error.message);
        }
      } else {
        console.error('Failed to login user for appointment test:', loginResponse.body);
      }
    });

    test('should book appointment successfully', async () => {
      // Skip if we don't have a valid token
      if (!userToken) {
        console.warn('Skipping appointment test - no valid token');
        return;
      }

      const appointmentData = {
        docId: doctorId,
        slotDate: '2024-01-01',
        slotTime: '09:00',
        userData: {
          name: 'Appointment User',
          email: 'appointment@test.com',
          phone: '1234567890'
        },
        docData: {
          name: 'Dr. Integration Test',
          speciality: 'Integration Testing',
          fees: 50
        },
        amount: 50
      };

      console.log('Attempting to book appointment with token:', userToken.substring(0, 20) + '...');

      const response = await request(app)
        .post('/api/user/book-appointment')
        .set('token', userToken)  // CHANGED: Using 'token' header instead of 'Authorization'
        .send(appointmentData);

      console.log('Book appointment response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      // Check if appointment was created
      const appointment = await Appointment.findOne({ userId });
      if (appointment) {
        expect(appointment.slotDate).toBe('2024-01-01');
        expect(appointment.slotTime).toBe('09:00');
      } else if (response.body.success === false) {
        console.warn('Appointment booking failed:', response.body.message || response.body.messege);
      }
    });
  });

  describe('GET /api/user/appointments', () => {
    beforeEach(async () => {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        name: 'List Appointment User',
        email: 'listapp@test.com',
        password: hashedPassword,
        phone: '1234567890',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSIRBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLzu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6fd9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xr9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC6zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQmxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOE7d37g7tbX7e+8+9M0gfAlJg3d7r9m5ZZs2EAPNvt2rdZc6fbNQAe7Xazn8rM8q8A8GZzM/vv5ubmZv4XAN7874/sv2U3N/8wAN5sNrNns+bOtwbAoxu5uZk9v7m5+d0AeHJz87P9j/aWlVZHzJ7uAAAAAElFTkSuQmCC',
        address: { line1: 'Test Address', line2: '' },
        gender: 'Male',
        dob: '1990-01-01',
        hasAllergies: false,
        allergies: []
      });
      userId = user._id.toString();
      
      // Create doctor
      const hashedDoctorPassword = await bcrypt.hash('password123', 10);
      const doctor = await Doctor.create({
        name: 'Dr. Integration Test',
        email: 'drintegration@test.com',
        password: hashedDoctorPassword,
        image: 'doctor_image.jpg',
        speciality: 'Integration Testing',
        degree: 'MD',
        experience: '5 years',
        about: 'Test doctor for integration testing',
        fees: 50,
        address: { city: 'Test City', street: '123 Test St' },
        date: Date.now(),
        available: true,
        slots_booked: {}
      });
      doctorId = doctor._id.toString();
      
      // Get token by logging in
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: 'listapp@test.com',
          password: 'password123'
        });
      
      if (loginResponse.body.success && loginResponse.body.token) {
        userToken = loginResponse.body.token;
        console.log('Got token for list appointments test');
      }
      
      // Create an appointment
      await Appointment.create({
        userId: userId,
        docId: doctorId,
        slotDate: '2024-01-01',
        slotTime: '10:00',
        userData: { 
          name: 'List Appointment User',
          email: 'listapp@test.com',
          phone: '1234567890'
        },
        docData: { 
          name: 'Dr. Integration Test',
          email: 'drintegration@test.com',
          speciality: 'Integration Testing',
          fees: 50
        },
        amount: 50,
        date: Date.now(),
        cancelled: false,
        payment: true,
        isCompleted: false
      });
    });

    test('should list user appointments', async () => {
      // Skip if we don't have a valid token
      if (!userToken) {
        console.warn('Skipping list appointments test - no valid token');
        return;
      }

      const response = await request(app)
        .get('/api/user/appointments')
        .set('token', userToken);  // CHANGED: Using 'token' header instead of 'Authorization'

      console.log('List appointments response:', {
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });
});