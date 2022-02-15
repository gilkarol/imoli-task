import mongoose, { Schema } from 'mongoose'

const listSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	movieIds: [
		{
			type: String,
		},
	],
	movies: [
		{
			type: Schema.Types.ObjectId,
			ref: 'ListItem',
		},
	],
})

export default mongoose.model('List', listSchema)
