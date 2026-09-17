const db = require("../models/db");

const ALLOWED_KEYS = ["themeMode", "primaryColor", "density", "fontFamily", "logoPreview"];
const DEFAULT_SETTINGS = {
  themeMode: "system",
  primaryColor: "blue",
  density: "comfortable",
  fontFamily: "inter",
  logoPreview: "",
};

let tablesReady = false;

async function ensureTables() {
  if (tablesReady) return;

  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS user_theme_settings (
      user_id INT NOT NULL PRIMARY KEY,
      settings LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.promise().query(
      `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
      [key, value]
    );
  }

  tablesReady = true;
}

function rowsToObject(rows) {
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.setting_key) {
      settings[row.setting_key] = row.setting_value ?? "";
    }
  }
  return settings;
}

function parseThemePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  const settings = {};
  for (const key of ALLOWED_KEYS) {
    if (payload[key] !== undefined && payload[key] !== null) {
      settings[key] = String(payload[key]);
    }
  }
  return settings;
}

const getSystemSettings = async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await db.promise().query(
      "SELECT setting_key, setting_value, updated_at FROM system_settings"
    );
    const settings = rowsToObject(rows);

    return res.status(200).json({
      success: true,
      settings,
      data: settings,
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch system settings",
    });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    await ensureTables();
    const incoming = parseThemePayload(req.body);

    if (Object.keys(incoming).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings provided",
      });
    }

    for (const [key, value] of Object.entries(incoming)) {
      await db.promise().query(
        `INSERT INTO system_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }

    const [rows] = await db.promise().query(
      "SELECT setting_key, setting_value FROM system_settings"
    );
    const settings = rowsToObject(rows);

    return res.status(200).json({
      success: true,
      message: "Settings updated",
      settings,
      data: settings,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update system settings",
    });
  }
};

const getUserThemeSettings = async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user_id || req.user?.user_id;
    const [rows] = await db.promise().query(
      "SELECT settings FROM user_theme_settings WHERE user_id = ?",
      [userId]
    );

    let settings = {};
    if (rows.length > 0 && rows[0].settings) {
      try {
        settings = JSON.parse(rows[0].settings);
      } catch (e) {
        settings = {};
      }
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/settings/user-theme error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user theme settings",
    });
  }
};

const saveUserThemeSettings = async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user_id || req.user?.user_id;
    const incoming = parseThemePayload(req.body);

    const [existing] = await db.promise().query(
      "SELECT settings FROM user_theme_settings WHERE user_id = ?",
      [userId]
    );

    let merged = {};
    if (existing.length > 0 && existing[0].settings) {
      try {
        merged = JSON.parse(existing[0].settings) || {};
      } catch (e) {
        merged = {};
      }
    }
    merged = { ...merged, ...incoming };

    await db.promise().query(
      `INSERT INTO user_theme_settings (user_id, settings)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE settings = VALUES(settings)`,
      [userId, JSON.stringify(merged)]
    );

    return res.status(200).json({
      success: true,
      message: "Theme settings saved",
      settings: merged,
    });
  } catch (error) {
    console.error("POST /api/settings/user-theme error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save user theme settings",
    });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  getUserThemeSettings,
  saveUserThemeSettings,
};
