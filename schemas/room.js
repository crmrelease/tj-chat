const mongoose = require('mongoose')

const {Schema} = mongoose;
const roomSchema = new Schema({
    title:{
        type:String,
        required: true,
    },
    max:{
        type:Number,
        required: true,
        default:10,
        min:2,
    }
})

module.exports = mongoose.model('Room',roomSchema);