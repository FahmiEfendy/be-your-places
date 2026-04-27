const Busboy = require("busboy");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};

const fileUploadMiddleware = (req, res, next) => {
  if (
    !req.headers["content-type"] ||
    req.headers["content-type"].indexOf("multipart/form-data") !== 0
  ) {
    return next();
  }

  const busboy = Busboy({ headers: req.headers });

  const buffers = [];
  let formData = {};
  let originalFileName = "";
  let mimeType = "";

  busboy.on("field", (fieldname, val) => {
    formData[fieldname] = val;
  });

  busboy.on("file", (fieldname, file, info) => {
    const { filename, encoding, mimetype } = info;
    const ext = MIME_TYPE_MAP[mimetype];
    if (!ext) {
      return res.status(400).json({ error: "Invalid File Type!" });
    }

    mimeType = mimetype;
    originalFileName = filename;

    file.on("data", (data) => {
      buffers.push(data);
    });

    file.on("end", () => {
      // File fully received
    });
  });

  busboy.on("finish", () => {
    req.body = formData;
    if (buffers.length > 0) {
      req.file = {
        originalname: originalFileName,
        buffer: Buffer.concat(buffers),
        mimetype: mimeType,
      };
    }
    next();
  });

  req.pipe(busboy);
};

module.exports = { fileUploadMiddleware };
