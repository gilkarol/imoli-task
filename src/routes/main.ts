import { Response, Request, NextFunction, Router } from 'express'

import fetch from 'node-fetch'

const router = Router()

router.get(
	'/films',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await (
				await fetch('https://swapi.dev/api/films/')
			).json()
			const result = response.results.map((item: any) => {
				return {
					release_date: item.release_date,
					title: item.title,
					movie_id: item.url.split('/')[5],
				}
			})
			res.status(200).json({ films: result })
		} catch (err) {
			console.log(err)
		}
	}
)

export default router
