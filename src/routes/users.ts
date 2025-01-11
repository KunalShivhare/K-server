import express from "express"
import { Request, Response } from "express"
const router = express.Router()

router.get("/", async (req: Request, res: Response) => {
  try {
    res.status(200).json("Working...")
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

export default router
