import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
export default function uploadToCloudinary(buffer, folder, resourceType = 'auto') { return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => error ? reject(error) : resolve(result)); streamifier.createReadStream(buffer).pipe(stream); }); }
