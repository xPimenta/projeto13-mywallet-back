import express from "express"
import cors from "cors"
import userRouter from "./routes/userRouter.js"
import statementsRouter from "./routes/statementsRouter.js"

const app = express()
app.use(express.json())
app.use(cors())

app.use(userRouter)
app.use(statementsRouter)

app.listen(5000, () => {
    console.log("Server running on port " + 5000)
})