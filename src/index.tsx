require("dotenv").config()
const express = require("express")
const path = require("path")
const usersRouter = require("./routes/users.ts")
const authRouter = require("./routes/auth.ts")
const cors = require("cors")
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use("/api/users", usersRouter)

app.use("/api/auth", authRouter)

app.listen(PORT, async () => {
  console.log("Server is running at http://localhost:" + PORT)
})
