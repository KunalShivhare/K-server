const express = require("express")
const jwt = require("jsonwebtoken")
const { neon } = require("@neondatabase/serverless")
const { v4: uuidv4 } = require("uuid")
const authRouter = express.Router()
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION_MINUTES = process.env.JWT_EXPIRATION_MINUTES

authRouter.post("/request-otp", async (req, res) => {
  const { phoneNumber } = req.body
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" })
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString() // Generate a 6-digit OTP
  const otpExpiration = new Date(
    Date.now() + Number(process.env.OTP_EXPIRATION_MINUTES) * 60 * 1000
  )
  console.log("🚀 ~ authRouter.post ~ new Date():", new Date())
  console.log("🚀 ~ authRouter.post ~ otpExpiration:", otpExpiration)
  const sql = neon(process.env.DATABASE_URL)

  try {
    await sql`
      INSERT INTO users (phoneNumber, otp, otp_created_at, otp_valid_until, is_verified)
      VALUES (${phoneNumber}, ${otp}, ${new Date()},${otpExpiration}, FALSE)
      ON CONFLICT (phoneNumber) DO UPDATE 
      SET otp = ${otp}, otp_created_at = ${new Date()};
    `

    res.status(200).json({
      message: "OTP sent successfully",
      body: `Your verification code is ${otp}`,
    })
  } catch (error) {
    console.error("Error requesting OTP:", error)
    res.status(500).json({ error: "Failed to send OTP" })
  }
})

authRouter.post("/verify-otp", async (req, res) => {
  const { phoneNumber, otp } = req.body
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" })
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    const users =
      await sql`SELECT * FROM users WHERE phoneNumber = ${phoneNumber}`
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = users[0]
    const otpExpiration = new Date(user.otp_created_at)
    otpExpiration.setMinutes(
      otpExpiration.getMinutes() + parseInt(process.env.OTP_EXPIRATION_MINUTES)
    )

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" })
    }

    if (new Date() > otpExpiration) {
      return res.status(400).json({ error: "OTP expired" })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: `${JWT_EXPIRATION_MINUTES}m`,
    })

    await sql`UPDATE users SET is_verified = TRUE, otp = NULL, otp_created_at = NULL, last_login = CURRENT_TIMESTAMP WHERE phoneNumber = ${phoneNumber}`

    res
      .status(200)
      .json({ message: "Phone number verified successfully", token })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    res.status(500).json({ error: "Failed to verify OTP" })
  }
})

module.exports = authRouter
