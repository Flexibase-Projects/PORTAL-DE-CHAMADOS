import express from "express";
import { realtimeService } from "../services/realtimeService.js";

const router = express.Router();

router.get("/events", (req, res) => {
  realtimeService.connect(req, res);
});

export default router;

