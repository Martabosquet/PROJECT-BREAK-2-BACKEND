import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    resource: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('AdminLog', adminLogSchema);