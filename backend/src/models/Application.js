import mongoose from 'mongoose';
const applicationSchema = new mongoose.Schema({ job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true }, applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, coverLetter: { type: String, maxlength: 3000 }, resume: { url: String, publicId: String }, status: { type: String, enum: ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'], default: 'submitted' } }, { timestamps: true });
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
export default mongoose.model('Application', applicationSchema);
