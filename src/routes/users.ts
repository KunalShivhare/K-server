const expressRouter = require("express")
const { neon } = require("@neondatabase/serverless")

const router = expressRouter.Router()

router.get("/", async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const result = await sql`SELECT * FROM users;`

    res.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

module.exports = router
