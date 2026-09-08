const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_FILE = path.join(__dirname, 'data', 'app.db');
const OLD_TEMPLATES_FILE = path.join(__dirname, 'data', 'templates.json');
const OLD_PROJECTS_FILE = path.join(__dirname, 'data', 'projects.json');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new DatabaseSync(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skins (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id),
    templateId INTEGER NOT NULL REFERENCES templates(id),
    name TEXT NOT NULL,
    colorHex TEXT NOT NULL,
    colorIntensity INTEGER NOT NULL,
    fade INTEGER NOT NULL DEFAULT 0,
    textureType TEXT NOT NULL DEFAULT 'grain',
    grain INTEGER NOT NULL DEFAULT 0,
    logoUrl TEXT,
    logoName TEXT,
    logoX REAL,
    logoY REAL,
    logoW REAL,
    canvasWidth INTEGER NOT NULL,
    canvasHeight INTEGER NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Stand-in for real accounts until the login page exists. Every template/skin
// already carries a userId, so wiring up real auth later means swapping this
// constant for req.user.id — not another data migration.
function getDefaultUserId() {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (existing) {
    return existing.id;
  }
  db.prepare('INSERT INTO users (id, name, createdAt) VALUES (?, ?, ?)')
    .run(1, 'Local user', new Date().toISOString());
  return 1;
}

const DEFAULT_USER_ID = getDefaultUserId();

// One-time import from the old JSON stores, only if the DB tables are still
// empty — safe to call on every startup. The JSON files are left on disk
// untouched afterward, as a backup.
function migrateFromJsonIfNeeded() {
  const templateCount = db.prepare('SELECT COUNT(*) AS n FROM templates').get().n;
  if (templateCount === 0 && fs.existsSync(OLD_TEMPLATES_FILE)) {
    const raw = fs.readFileSync(OLD_TEMPLATES_FILE, 'utf-8').trim();
    const templates = raw ? JSON.parse(raw) : [];
    const insert = db.prepare(
      'INSERT INTO templates (id, userId, name, filename, url, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    );
    templates.forEach((t) => {
      insert.run(t.id, DEFAULT_USER_ID, t.name, t.filename, t.url, t.createdAt);
    });
  }

  const skinCount = db.prepare('SELECT COUNT(*) AS n FROM skins').get().n;
  if (skinCount === 0 && fs.existsSync(OLD_PROJECTS_FILE)) {
    const raw = fs.readFileSync(OLD_PROJECTS_FILE, 'utf-8').trim();
    const skins = raw ? JSON.parse(raw) : [];
    const insert = db.prepare(`
      INSERT INTO skins (
        id, userId, templateId, name, colorHex, colorIntensity, fade, textureType, grain,
        logoUrl, logoName, logoX, logoY, logoW, canvasWidth, canvasHeight, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    skins.forEach((s) => {
      insert.run(
        s.id,
        DEFAULT_USER_ID,
        Number(s.templateId),
        s.name,
        s.color.hex,
        s.color.intensity,
        typeof s.fade === 'number' ? s.fade : 0,
        s.textureType || 'grain',
        s.grain || 0,
        s.logo ? s.logo.url : null,
        s.logo ? s.logo.name : null,
        s.logo ? s.logo.x : null,
        s.logo ? s.logo.y : null,
        s.logo ? s.logo.w : null,
        s.canvasSize.width,
        s.canvasSize.height,
        s.updatedAt
      );
    });
  }
}

migrateFromJsonIfNeeded();

function rowToSkin(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    templateId: String(row.templateId),
    name: row.name,
    color: { hex: row.colorHex, intensity: row.colorIntensity },
    fade: row.fade,
    textureType: row.textureType,
    grain: row.grain,
    logo: row.logoUrl
      ? { url: row.logoUrl, name: row.logoName, x: row.logoX, y: row.logoY, w: row.logoW }
      : null,
    canvasSize: { width: row.canvasWidth, height: row.canvasHeight },
    updatedAt: row.updatedAt
  };
}

function listTemplates(userId = DEFAULT_USER_ID) {
  return db.prepare('SELECT id, name, filename, url, createdAt FROM templates WHERE userId = ? ORDER BY createdAt')
    .all(userId);
}

function insertTemplate(userId, { id, name, filename, url, createdAt }) {
  db.prepare('INSERT INTO templates (id, userId, name, filename, url, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, name, filename, url, createdAt);
  return { id, name, filename, url, createdAt };
}

function listSkins(userId = DEFAULT_USER_ID, templateId) {
  const rows = templateId
    ? db.prepare('SELECT * FROM skins WHERE userId = ? AND templateId = ? ORDER BY updatedAt DESC').all(userId, Number(templateId))
    : db.prepare('SELECT * FROM skins WHERE userId = ? ORDER BY updatedAt DESC').all(userId);
  return rows.map(rowToSkin);
}

function getSkinById(userId, id) {
  const row = db.prepare('SELECT * FROM skins WHERE userId = ? AND id = ?').get(userId, Number(id));
  return rowToSkin(row);
}

function insertSkin(userId, skin) {
  db.prepare(`
    INSERT INTO skins (
      id, userId, templateId, name, colorHex, colorIntensity, fade, textureType, grain,
      logoUrl, logoName, logoX, logoY, logoW, canvasWidth, canvasHeight, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    skin.id, userId, Number(skin.templateId), skin.name, skin.color.hex, skin.color.intensity,
    skin.fade, skin.textureType, skin.grain,
    skin.logo ? skin.logo.url : null,
    skin.logo ? skin.logo.name : null,
    skin.logo ? skin.logo.x : null,
    skin.logo ? skin.logo.y : null,
    skin.logo ? skin.logo.w : null,
    skin.canvasSize.width, skin.canvasSize.height, skin.updatedAt
  );
  return getSkinById(userId, skin.id);
}

function updateSkin(userId, id, skin) {
  const existing = db.prepare('SELECT id FROM skins WHERE userId = ? AND id = ?').get(userId, Number(id));
  if (!existing) {
    return null;
  }
  db.prepare(`
    UPDATE skins SET
      name = ?, colorHex = ?, colorIntensity = ?, fade = ?, textureType = ?, grain = ?,
      logoUrl = ?, logoName = ?, logoX = ?, logoY = ?, logoW = ?,
      canvasWidth = ?, canvasHeight = ?, updatedAt = ?
    WHERE userId = ? AND id = ?
  `).run(
    skin.name, skin.color.hex, skin.color.intensity, skin.fade, skin.textureType, skin.grain,
    skin.logo ? skin.logo.url : null,
    skin.logo ? skin.logo.name : null,
    skin.logo ? skin.logo.x : null,
    skin.logo ? skin.logo.y : null,
    skin.logo ? skin.logo.w : null,
    skin.canvasSize.width, skin.canvasSize.height, skin.updatedAt,
    userId, Number(id)
  );
  return getSkinById(userId, id);
}

module.exports = {
  DEFAULT_USER_ID,
  listTemplates,
  insertTemplate,
  listSkins,
  getSkinById,
  insertSkin,
  updateSkin
};
