import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    companyLogo: { type: String, trim: true, maxlength: 500 },
    companyDescription: { type: String, trim: true, maxlength: 2000 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      required: true,
    },
    skills: [String],
    salary: { min: Number, max: Number, currency: { type: String, default: 'INR' } },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true },
);

export default mongoose.model('Job', jobSchema);
