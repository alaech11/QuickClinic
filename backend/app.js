import express from "express";
import cors from "cors";

import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

// health check
app.get("/", (req, res) => {
  res.send("API WORKING");
});

export default app;
