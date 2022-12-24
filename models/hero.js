const mongoose = require('mongoose');
const Call = require('./call');

const heroSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        uppercase: true
    },
    location: {
        type: String,
        required: true,
        uppercase: true
    },
    turn: {
        type: String,
        uppercase: true
    },
    image: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true,
        uppercase: true
    },
    calls: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call'
    }]
});

// DELETE ALL ASSOCIATED CALLS AFTER A HERO IS DELETED
heroSchema.post('findOneAndDelete', async function (hero) {
    if (hero.calls.length) {
        const res = await Call.deleteMany({ _id: { $in: hero.calls } })
        console.log(res);
    }
})

module.exports = mongoose.model('Hero', heroSchema);