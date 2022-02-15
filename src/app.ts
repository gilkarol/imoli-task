import express, { Response, Request, NextFunction } from 'express'
import routes from './routes/main'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import bodyparser from 'body-parser'

const app = express()

app.use(bodyparser.json())
app.use((req: Request, res: Response, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
	  'Access-Control-Allow-Methods',
	  'GET, POST'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
  });

app.use(routes)


mongoose
	.connect(process.env.MONGODB_DATABASE as string)
	.then((result) => {
		app.listen(process.env.PORT || 8080)
	})
	.catch((err) => {
		console.log(err)
	})
