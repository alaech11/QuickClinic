import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT || 4000;

// Do NOT connect external services during tests
if (process.env.NODE_ENV !== "test") {
  connectDB();
  connectCloudinary();
}

app.listen(port, () => {
  console.log("Server started on port", port);
});
