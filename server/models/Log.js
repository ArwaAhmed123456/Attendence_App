const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    trade: String,
    car_reg: String,
    user_type: String,
    time_in: { type: String, required: true },
    time_out: { type: String, required: true },
    hours: Number,
    reason: String,
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
