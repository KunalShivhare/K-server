import express from "express"
import jwt from "jsonwebtoken"
import pg from "pg"
import config from "../database/index"
import { updateOTP } from "../services/auth"

const authRouter = express.Router()
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION_MINUTES = process.env.JWT_EXPIRATION_MINUTES

authRouter.post("/signup", async (req, res) => {
  const { email, name, phoneNumber } = req.body
  if (!email || !name || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Inputs are required - Email/Name/Phone Number" })
  }

  let dbClient
  try {
    dbClient = new pg.Client(config)
    dbClient
      .connect()
      .then(() => {
        console.log("database connected sucesfully!")
      })
      .catch((err) => console.log(err))
    await dbClient.query({
      text: `INSERT INTO users (email, name, phoneNumber) VALUES ($1, $2, $3)`,
      values: [email, name, phoneNumber],
      rowMode: "array",
    })
    const otp = await updateOTP(email)

    return res.status(200).json({
      message: "User Entry created with OTP",
      otp,
    })
  } catch (error) {
    console.log("🚀 ~ authRouter.post ~ error:", error)
    return res.status(400).json({
      message: error,
    })
  } finally {
    await dbClient?.end()
  }
})

authRouter.post("/login", async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res
      .status(400)
      .json({ error: "Inputs are required - Email/Name/Phone Number" })
  }
  try {
    const otp = await updateOTP(email)
    return res.status(200).json({
      message: "User Entry created with OTP",
      otp,
    })
  } catch (error) {
    console.log("🚀 ~ authRouter.post ~ error:", error)
    return res.status(400).json({
      message: error,
    })
  }
})

authRouter.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" })
  }
  let dbClient

  try {
    dbClient = new pg.Client(config)
    await dbClient.connect()
    const users = await dbClient.query({
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    })
    await dbClient.end()

    if (users.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = users.rows[0]
    const otpExpiration = new Date(user.otp_created_at)
    otpExpiration.setMinutes(
      otpExpiration.getMinutes() +
        parseInt(String(process.env.OTP_EXPIRATION_MINUTES))
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

    dbClient = new pg.Client(config)
    await dbClient.connect()
    await dbClient.query({
      text: "UPDATE users SET isverified = TRUE, otp = NULL, otpcreatedat = NULL, otpvaliduntil = NULL, lastlogin = CURRENT_TIMESTAMP WHERE email = $1",
      values: [email],
    })

    res.status(200).json({ message: "Email verified successfully", token })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    res.status(500).json({ error: "Failed to verify OTP" })
  } finally {
    await dbClient?.end()
  }
})

export default authRouter
