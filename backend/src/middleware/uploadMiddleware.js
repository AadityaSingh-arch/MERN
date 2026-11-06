import multer from 'multer';

const storage = multer.memoryStorage();

const rejectWith = (message) => Object.assign(new Error(message), { statusCode: 400 });

const allowTypes = (types, message) => (req, file, callback) =>
  types.includes(file.mimetype) ? callback(null, true) : callback(rejectWith(message));

export const uploadResume = multer({
  storage,
  fileFilter: allowTypes(
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    'Résumé must be a PDF, DOC or DOCX file',
  ),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('resume');

export const uploadAvatar = multer({
  storage,
  fileFilter: allowTypes(['image/jpeg', 'image/png', 'image/webp'], 'Profile image must be a JPG, PNG or WEBP file'),
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');
