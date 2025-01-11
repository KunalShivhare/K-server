dotenv.config()

import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import usersRouter from "./routes/users"
import authRouter from "./routes/auth"
import "./database/index"

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routes
app.use("/api/users", usersRouter)
app.use("/api/auth", authRouter)

app.get("/", async (req, res) => {
  res.status(200).json({ message: "Welcome to the K-Server" })
})

// Start server
app.listen(PORT, async () => {
  console.log("Server is running at http://localhost:" + PORT)
})
