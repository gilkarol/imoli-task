import { Response, Request, NextFunction, Router } from 'express'
import xlsx from 'xlsx'
import path from 'path'

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
			res
				.status(200)
				.json({ message: 'Movies found successfully!', films: result })
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
			const movies = movieId.replace(/\s/g, '').split(',').sort()
			const listExists =
				(await List.findOne({ name: name })) ||
				(await List.findOne({ movieIds: movies }))
			if (listExists)
				res
					.status(409)
					.json({ message: 'Error! List with this movies or with this name already exists!' })
			const list = new List({
				name: name,
				movieIds: movies,
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
						const person = await fetch(character)
						const personJson = await person.json()
						const newCharacter = new Character({
							URL: character,
							name: personJson.name,
						})
						await newCharacter.save()
						listItem.list_of_characters.push(newCharacter)
					}
				}
				await listItem.save()
				list.movies.push(listItem)
			}
			await list.save()
			res.status(201).json({ message: 'List added successfully!' })
		} catch (err) {
			next(err)
		}
	}
)

router.get(
	'/favorites',
	async (req: Request, res: Response, next: NextFunction) => {
		const page: number = +req.query.page! || 1
		const listsOnPage: number = 2
		try {
			const listsNumber: number = await List.countDocuments()
			const lists = await List.find()
				.select('name')
				.skip(listsOnPage * page - listsOnPage)
				.limit(listsOnPage)

			res.status(200).json({
				message: 'Lists found successfully!',
				lists: lists,
				hasPreviousPage: page !== 1,
				page: page,
				hasNextPage: listsOnPage * page < listsNumber,
			})
		} catch (err) {
			console.log(err)
		}
	}
)

router.get(
	'/favorites/:id',
	async (req: Request, res: Response, next: NextFunction) => {
		const listId: string = req.params.id
		try {
			const list = await List.findById(listId).populate({
				path: 'movies',
				populate: { path: 'list_of_characters', select: 'name' },
			})
			if (!list) res.status(404).json({ message: 'List not found!' })
			res.status(200).json({ message: 'List found successfully!', list: list })
		} catch (err) {
			next(err)
		}
	}
)

router.get(
	'/favorites/:id/file',
	async (req: Request, res: Response, next: NextFunction) => {
		const listId: string = req.params.id
		try {
			const list = await List.findById(listId).populate({
				path: 'movies',
				select: 'title list_of_characters',
				populate: {
					path: 'list_of_characters',
				},
			})
			const movies = list.movies
			const file: any = []
			for (let movie of movies) {
				for (let character of movie.list_of_characters) {
					const index = file.findIndex(
						(element: any) => element.character === character.name
					)
					if (index > -1) {
						file[index] = {
							character: character.name,
							movie: `${file[index].movie}, ${movie.title}`,
						}
					} else {
						file.push({ character: character.name, movie: movie.title })
					}
				}
			}
			const workBook = xlsx.utils.book_new()
			const workSheet = xlsx.utils.json_to_sheet(file)
			xlsx.utils.book_append_sheet(workBook, workSheet, 'list')

			xlsx.write(workBook, { bookType: 'xlsx', type: 'binary' })
			xlsx.write(workBook, { bookType: 'xlsx', type: 'buffer' })

			const buffer = Buffer.from(
				xlsx.write(workBook, { bookType: 'xlsx', type: 'buffer' })
			)
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			)
			res.status(200).send(buffer)
		} catch (err) {
			next(err)
		}
	}
)

router.use('*', async (req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({message: 'This route is invalid! Correct routes are: GET /films, POST /favorites, GET /favorites, GET /favorites/:id, GET /favorites/:id/file'})
})

export default router
