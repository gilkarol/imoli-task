import mongoose, { Schema } from 'mongoose'

const listSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	items: [
		{
			type: Schema.Types.ObjectId,
			ref: 'ListItem',
		},
	],
})

export default mongoose.model('List', listSchema)
