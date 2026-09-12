import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024,
		files: 1,
	},
	fileFilter: (req, file, callback) => {
		if (file.mimetype.startsWith("image/")) {
			return callback(null, true)
		}

		const error = new Error("Solo se permiten archivos de imagen")
		error.statusCode = 400
		callback(error)
	},
});

export default upload;