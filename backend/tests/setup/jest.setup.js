import { jest } from '@jest/globals';
import {
  connectTestDB,
  closeTestDB,
  clearTestDB,
} from "./testDb.js";

// Increase timeout for all tests
jest.setTimeout(30000);

beforeAll(async () => {
  try {
    await connectTestDB();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    await clearTestDB();
  } catch (error) {
    console.error('Failed to clear test database:', error);
  }
});

afterAll(async () => {
  try {
    await closeTestDB();
  } catch (error) {
    console.error('Failed to close test database:', error);
  }
});