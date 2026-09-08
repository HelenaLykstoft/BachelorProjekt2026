const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const db = require('./db');

const PORT = 8000;
const TEMPLATES_DIR = path.join(__dirname, 'uploads', 'templates');
const LOGOS_DIR = path.join(__dirname, 'uploads', 'logos');
const PID_FILE = path.join(__dirname, '.server.pid');

fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
fs.mkdirSync(LOGOS_DIR, { recursive: true });

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

function pngFileFilter(req, file, cb) {
  const isPng = file.mimetype === 'image/png'
    && path.extname(file.originalname).toLowerCase() === '.png';
  cb(isPng ? null : new Error('INVALID_FILE_TYPE'), isPng);
}

function pngFilename(req, file, cb) {
  cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`);
}

const upload = multer({
  storage: multer.diskStorage({ destination: TEMPLATES_DIR, filename: pngFilename }),
  fileFilter: pngFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadLogo = multer({
  storage: multer.diskStorage({ destination: LOGOS_DIR, filename: pngFilename }),
  fileFilter: pngFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.get('/api/templates', (req, res) => {
  res.json(db.listTemplates());
});

app.post('/api/templates', (req, res) => {
  upload.single('template')(req, res, (err) => {
    if (err) {
      const message = err.message === 'INVALID_FILE_TYPE'
        ? 'Only PNG files are accepted. Please choose a .png file.'
        : 'The file is too large or could not be uploaded. Please try again.';
      return res.status(400).json({ success: false, message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was received. Please choose a PNG file.' });
    }

    const name = (req.body.name || '').trim() || req.file.originalname.replace(/\.png$/i, '');
    const template = db.insertTemplate(db.DEFAULT_USER_ID, {
      id: Date.now(),
      name,
      filename: req.file.filename,
      url: `/uploads/templates/${req.file.filename}`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: `"${template.name}" was uploaded successfully.`,
      template
    });
  });
});

app.post('/api/logos', (req, res) => {
  uploadLogo.single('logo')(req, res, (err) => {
    if (err) {
      const message = err.message === 'INVALID_FILE_TYPE'
        ? 'Only PNG files are accepted. Please choose a .png file.'
        : 'The file is too large or could not be uploaded. Please try again.';
      return res.status(400).json({ success: false, message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was received. Please choose a PNG file.' });
    }

    res.status(201).json({
      success: true,
      logo: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/logos/${req.file.filename}`
      }
    });
  });
});

function validateSkinPayload(body) {
  if (!body.name || !body.name.trim()) {
    return 'Please name this skin before saving.';
  }
  if (!body.color || typeof body.color.hex !== 'string' || typeof body.color.intensity !== 'number') {
    return 'Missing or invalid color data.';
  }
  if (!body.canvasSize || typeof body.canvasSize.width !== 'number' || typeof body.canvasSize.height !== 'number') {
    return 'Missing or invalid canvas size.';
  }
  return null;
}

app.get('/api/projects', (req, res) => {
  const { templateId } = req.query;
  res.json({ projects: db.listSkins(db.DEFAULT_USER_ID, templateId) });
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.getSkinById(db.DEFAULT_USER_ID, req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Skin not found.' });
  }
  res.json({ project });
});

app.post('/api/projects', (req, res) => {
  if (!req.body.templateId) {
    return res.status(400).json({ success: false, message: 'Missing template.' });
  }
  const error = validateSkinPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const record = {
    id: Date.now(),
    templateId: String(req.body.templateId),
    name: req.body.name.trim(),
    color: req.body.color,
    fade: typeof req.body.fade === 'number' ? req.body.fade : 0,
    textureType: typeof req.body.textureType === 'string' ? req.body.textureType : 'grain',
    grain: typeof req.body.grain === 'number' ? req.body.grain : 0,
    logo: req.body.logo || null,
    canvasSize: req.body.canvasSize,
    updatedAt: new Date().toISOString()
  };

  const saved = db.insertSkin(db.DEFAULT_USER_ID, record);

  res.status(201).json({ success: true, message: `"${saved.name}" was saved.`, project: saved });
});

app.put('/api/projects/:id', (req, res) => {
  const error = validateSkinPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const record = {
    name: req.body.name.trim(),
    color: req.body.color,
    fade: typeof req.body.fade === 'number' ? req.body.fade : 0,
    textureType: typeof req.body.textureType === 'string' ? req.body.textureType : 'grain',
    grain: typeof req.body.grain === 'number' ? req.body.grain : 0,
    logo: req.body.logo || null,
    canvasSize: req.body.canvasSize,
    updatedAt: new Date().toISOString()
  };

  const saved = db.updateSkin(db.DEFAULT_USER_ID, req.params.id, record);
  if (!saved) {
    return res.status(404).json({ success: false, message: 'Skin not found.' });
  }

  res.json({ success: true, message: `"${saved.name}" was saved.`, project: saved });
});

app.listen(PORT, () => {
  fs.writeFileSync(PID_FILE, String(process.pid));
  console.log(`Server running at http://localhost:${PORT}`);
});

function cleanupAndExit() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
