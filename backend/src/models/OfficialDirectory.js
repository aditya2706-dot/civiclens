const mongoose = require('mongoose');

const officialDirectorySchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        unique: true
    },
    ward: {
        type: String,
        required: [true, 'Please add a ward']
    },
    department: {
        type: String,
        required: [true, 'Please add a department']
    },
    isRegistered: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OfficialDirectory', officialDirectorySchema);
