import express from 'express'
import routes from './routes/main'

const app = express()

app.use(routes)

app.listen()