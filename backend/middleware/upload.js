import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, nombreUnico);
  },
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    // PDF
    'application/pdf',

    // WORD
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    // TXT
    'text/plain',

    // IMÁGENES
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;
