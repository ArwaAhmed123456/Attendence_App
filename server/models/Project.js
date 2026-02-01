const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
