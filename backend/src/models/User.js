import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema({ name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, password: { type: String, required: true, minlength: 8, select: false }, role: { type: String, enum: ['admin', 'recruiter', 'applicant'], default: 'applicant' }, avatar: { url: String, publicId: String } }, { timestamps: true });
userSchema.methods.matchesPassword = function matchesPassword(password) { return bcrypt.compare(password, this.password); };
export default mongoose.model('User', userSchema);
