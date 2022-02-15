import mongoose, { Schema } from 'mongoose'

const characterSchema = new Schema({
	URL: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true
	}
})

export default mongoose.model('Character', characterSchema)
