import express from 'express'
import routes from './routes/main'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import bodyparser from 'body-parser'

const app = express()
app.use(bodyparser.json())
app.use(routes)
mongoose
	.connect(process.env.MONGODB_DATABASE as string)
	.then((result) => {
		app.listen(8080)
	})
	.catch((err) => {
		console.log(err)
	})
