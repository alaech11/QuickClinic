import {
  connectTestDB,
  closeTestDB,
  clearTestDB,
} from "./testDb.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});
