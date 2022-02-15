"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const xlsx_1 = __importDefault(require("xlsx"));
const Character_1 = __importDefault(require("../models/Character"));
const ListItem_1 = __importDefault(require("../models/ListItem"));
const List_1 = __importDefault(require("../models/List"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
router.get('/films', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (yield (0, node_fetch_1.default)('https://swapi.dev/api/films/')).json();
        const result = response.results.map((film) => {
            return {
                release_date: film.release_date,
                title: film.title,
                movie_id: film.url.split('/')[5],
            };
        });
        res
            .status(200)
            .json({ message: 'Movies found successfully!', films: result });
    }
    catch (err) {
        console.log(err);
    }
}));
router.post('/favorites', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const movieId = req.body.movieId;
    const name = req.body.name;
    try {
        const movies = movieId.replace(/\s/g, '').split(',').sort();
        const listExists = (yield List_1.default.findOne({ name: name })) ||
            (yield List_1.default.findOne({ movieIds: movies }));
        if (listExists)
            res
                .status(409)
                .json({ message: 'Error! List with this movies or with this name already exists!' });
        const list = new List_1.default({
            name: name,
            movieIds: movies,
        });
        for (let movie of movies) {
            const response = yield (yield (0, node_fetch_1.default)('https://swapi.dev/api/films/' + movie)).json();
            const listItem = new ListItem_1.default({
                release_date: response.release_date,
                title: response.title,
            });
            const characters = response.characters;
            for (let character of characters) {
                const char = yield Character_1.default.findOne({ URL: character });
                if (char)
                    listItem.list_of_characters.push(char);
                if (!char) {
                    const person = yield (0, node_fetch_1.default)(character);
                    const personJson = yield person.json();
                    const newCharacter = new Character_1.default({
                        URL: character,
                        name: personJson.name,
                    });
                    yield newCharacter.save();
                    listItem.list_of_characters.push(newCharacter);
                }
            }
            yield listItem.save();
            list.movies.push(listItem);
        }
        yield list.save();
        res.status(201).json({ message: 'List added successfully!' });
    }
    catch (err) {
        next(err);
    }
}));
router.get('/favorites', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const page = +req.query.page || 1;
    const listsOnPage = 2;
    try {
        const listsNumber = yield List_1.default.countDocuments();
        const lists = yield List_1.default.find()
            .select('name')
            .skip(listsOnPage * page - listsOnPage)
            .limit(listsOnPage);
        res.status(200).json({
            message: 'Lists found successfully!',
            lists: lists,
            hasPreviousPage: page !== 1,
            page: page,
            hasNextPage: listsOnPage * page < listsNumber,
        });
    }
    catch (err) {
        console.log(err);
    }
}));
router.get('/favorites/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const listId = req.params.id;
    try {
        const list = yield List_1.default.findById(listId).populate({
            path: 'movies',
            populate: { path: 'list_of_characters', select: 'name' },
        });
        if (!list)
            res.status(404).json({ message: 'List not found!' });
        res.status(200).json({ message: 'List found successfully!', list: list });
    }
    catch (err) {
        next(err);
    }
}));
router.get('/favorites/:id/file', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const listId = req.params.id;
    try {
        const list = yield List_1.default.findById(listId).populate({
            path: 'movies',
            select: 'title list_of_characters',
            populate: {
                path: 'list_of_characters',
            },
        });
        const movies = list.movies;
        const file = [];
        for (let movie of movies) {
            for (let character of movie.list_of_characters) {
                const index = file.findIndex((element) => element.character === character.name);
                if (index > -1) {
                    file[index] = {
                        character: character.name,
                        movie: `${file[index].movie}, ${movie.title}`,
                    };
                }
                else {
                    file.push({ character: character.name, movie: movie.title });
                }
            }
        }
        const workBook = xlsx_1.default.utils.book_new();
        const workSheet = xlsx_1.default.utils.json_to_sheet(file);
        xlsx_1.default.utils.book_append_sheet(workBook, workSheet, 'list');
        xlsx_1.default.write(workBook, { bookType: 'xlsx', type: 'binary' });
        xlsx_1.default.write(workBook, { bookType: 'xlsx', type: 'buffer' });
        const buffer = Buffer.from(xlsx_1.default.write(workBook, { bookType: 'xlsx', type: 'buffer' }));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);
    }
    catch (err) {
        next(err);
    }
}));
router.use('*', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(404).json({ message: 'This route is invalid! Correct routes are: GET /films, POST /favorites, GET /favorites, GET /favorites/:id, GET /favorites/:id/file' });
}));
exports.default = router;
