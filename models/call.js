const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    location: {
        type: String,
        required: true,
        uppercase: true
    },
    description: {
        type: String,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        uppercase: true
    },
    hero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hero',
        required: true
    }
});

module.exports = mongoose.model('Call', callSchema);