import express from 'express'
import routes from './routes/main'

import bodyparser from 'body-parser'

const app = express()

app.use(bodyparser.json())
app.use(routes)

app.listen(8080)