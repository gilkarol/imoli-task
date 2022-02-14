import { Response, Request, NextFunction, Router } from 'express'

import Character from '../models/Character'
import ListItem from '../models/ListItem'
import List from '../models/List'
import fetch from 'node-fetch'

const router = Router()

router.get(
	'/films',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await (
				await fetch('https://swapi.dev/api/films/')
			).json()
			const result = response.results.map((film: any) => {
				return {
					release_date: film.release_date,
					title: film.title,
					movie_id: film.url.split('/')[5],
				}
			})
			res.status(200).json({ films: result })
		} catch (err) {
			console.log(err)
		}
	}
)

router.post(
	'/favorites',
	async (req: Request, res: Response, next: NextFunction) => {
		const movieId: string = req.body.movieId
		const name: string = req.body.name

		try {
			const listExists = await List.findOne({ name: name })
			if (listExists)
				res
					.status(409)
					.json({ message: 'Error! List with this name already exists!' })
			const movies = movieId.split(', ')
			const list = new List({
				name: name,
			})
			for (let movie of movies) {
				const response = await (
					await fetch('https://swapi.dev/api/films/' + movie)
				).json()
				const listItem = new ListItem({
					release_date: response.release_date,
					title: response.title,
				})

				const characters = response.characters
				for (let character of characters) {
					const char = await Character.findOne({ URL: character })
					if (char) listItem.list_of_characters.push(char)

					if (!char) {
						const newCharacter = new Character({
							URL: character,
						})
						await newCharacter.save()
						listItem.list_of_characters.push(newCharacter)
					}
				}
				await listItem.save()
				list.items.push(listItem)
			}
			await list.save()
			res.status(200).json({ message: 'success' })
		} catch (err) {
			next(err)
		}
	}
)

export default router
