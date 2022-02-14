import mongoose, { Schema } from 'mongoose'

const listItemSchema = new Schema({
	release_date: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	list_of_characters: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Character',
		},
	],
})

export default mongoose.model('ListItem', listItemSchema)
