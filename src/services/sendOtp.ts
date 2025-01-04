const twilio = require("twilio")

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const sendOTPViaSMS = async (phoneNumber: string, otp: string) => {
  const response = await client.messages.create({
    body: `Your verification code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  })
  return response
}
