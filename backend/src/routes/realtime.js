import express from "express";
import { realtimeService } from "../services/realtimeService.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/events", requireAuth, (req, res) => {
  realtimeService.connect(req, res);
});

export default router;

