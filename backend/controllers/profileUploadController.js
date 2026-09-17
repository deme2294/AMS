const con = require("../models/db"); // Assumes you have a db.js file that exports the database connection
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { validateUploadedFile } = require("../middleware/uploadMiddleware");
const subscriptionController = require("./subscriptionController");

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB limit for avatars
  fileFilter: imageFilter
}).single("avatar");

// Multer instance for a SINGLE event image
const uploadNewsEventImage = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: imageFilter
}).single("imageFile"); // Expects a single file with field name "imageFile"

// NEW Multer instance for MULTIPLE news images
const uploadMultipleNewsImages = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit per file
  fileFilter: imageFilter
}).array("newsImages", 10); // Expects multiple files (up to 10) with field name "newsImages"


const uploadProfilePicture = (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: "File upload failed. Please ensure your image is under 2MB." });
    }

    // SECURITY: Perform deep content scan (magic bytes + script detection)
    try {
      await validateUploadedFile(req, res, () => { });
      if (res.headersSent) return; // Exit if validation failed and sent response
    } catch (vErr) {
      return res.status(400).json({ error: "Security validation failed. Malicious content detected." });
    }

    // IDOR protection: Use the ID from the authenticated token
    // Only allow Admins (role_id: 1) to upload for other users
    const userToUpdate = (req.user.role_id === 1 && req.body.user_id) ? req.body.user_id : req.user.user_id;

    if (!userToUpdate) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting orphaned avatar:", req.file.path, unlinkErr);
        });
      }
      return res.status(400).json({ error: "User context not found." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const sql = `UPDATE users SET avatar_url = ? WHERE user_id = ?`;
    con.query(sql, [avatarUrl, userToUpdate], (dbErr, result) => {
      if (dbErr) {
        console.error("Database error:", dbErr);
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting avatar after DB error:", req.file.path, unlinkErr);
        });
        return res.status(500).json({ error: "Database update failed." });
      }

      console.log(`Profile picture uploaded for user: ${userToUpdate} - URL: ${avatarUrl}`);
      res.json({ success: true, avatarUrl });
    });
  });
};

const getProfilePicture = (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required." });
  }

  console.log(`Fetching profile picture for user: ${user_id}`);

  const sql = "SELECT avatar_url FROM users WHERE user_id = ?";
  con.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database query failed." });
    }

    if (result.length === 0) {
      console.error("User not found for ID:", user_id);
      return res.status(404).json({ error: "User not found." });
    }

    const avatarUrl = result[0].avatar_url;
    if (!avatarUrl) {
      console.error("No profile picture found for user:", user_id);
      return res.status(404).json({ error: "No profile picture found." });
    }

    // Construct full URL for client
    const fullAvatarUrl = `${req.protocol}://${req.get("host")}${avatarUrl}`;
    console.log(`Profile picture fetched for user: ${user_id} - URL: ${fullAvatarUrl}`);
    res.json({
      success: true,
      avatarUrl: fullAvatarUrl
    });
  });
};

const postNews = (req, res) => {
  uploadMultipleNewsImages(req, res, async (err) => {
    if (err) {
      console.error("Multer error for news images:", err);
      return res.status(400).json({ error: "News images upload failed. Check file size and type." });
    }

    // SECURITY: Perform deep content scan (magic bytes + script detection)
    try {
      await validateUploadedFile(req, res, () => { });
      if (res.headersSent) return;
    } catch (vErr) {
      return res.status(400).json({ error: "Security validation failed. Malicious content detected in news images." });
    }

    const { title, date, category, description, featured, readTime, tags, youtubeUrl } = req.body;

    if (!title || !date || !category || !description || !readTime) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned news image (validation fail):", file.filename, unlinkErr);
          });
        });
      }
      return res.status(400).json({ error: "Missing required fields for news item." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one news image is required." });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    const imagesJson = JSON.stringify(imageUrls);
    const isFeatured = featured === 'true' || featured === true;

    let tagsJson = null;
    if (tags) {
      if (Array.isArray(tags)) {
        tagsJson = JSON.stringify(tags.map(t => String(t).trim()).filter(t => t));
      } else if (typeof tags === 'string') {
        tagsJson = JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t));
      }
    } else {
      tagsJson = JSON.stringify([]); // Store empty array if no tags
    }

    const finalYoutubeUrl = youtubeUrl && youtubeUrl.trim() !== '' ? youtubeUrl.trim() : null;

    const sql = `INSERT INTO news (title, date, category, image, description, featured, readTime, tags, youtubeUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [title, date, category, imagesJson, description, isFeatured, readTime, tagsJson, finalYoutubeUrl];

    con.query(sql, values, (dbErr, result) => {
      if (dbErr) {
        console.error("Database error inserting news:", dbErr);
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned news image (DB fail):", file.filename, unlinkErr);
          });
        });
        return res.status(500).json({ error: "Failed to save news item to database." });
      }
      console.log(`News item added: ${title}, ID: ${result.insertId}`);
      res.status(201).json({
        success: true,
        message: "News item added successfully.",
        newsId: result.insertId,
        imageUrls: imageUrls, // Relative URLs
        youtubeUrl: finalYoutubeUrl
      });

      // Notify subscribers about new news
      const newsItem = {
        id: result.insertId,
        title,
        date,
        description
      };
      subscriptionController.notifySubscribers('news', newsItem);
    });
  });
};
// Configure storage for event images (same as news images)
const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create multer upload instance for multiple event images
const uploadMultipleEventImages = multer({
  storage: eventStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).array('newsImages', 10); // Using same field name as news images for consistency
const postEvent = (req, res) => {
  uploadMultipleEventImages(req, res, async (err) => {
    if (err) {
      console.error("Multer error for event images:", err);
      return res.status(400).json({ error: "Event images upload failed. Check file size and type." });
    }

    // SECURITY: Perform deep content scan (magic bytes + script detection)
    try {
      await validateUploadedFile(req, res, () => { });
      if (res.headersSent) return;
    } catch (vErr) {
      return res.status(400).json({ error: "Security validation failed. Malicious content detected in event images." });
    }

    const { title, date, time, venue, description, featured, registrationLink, capacity, tags } = req.body;

    if (!title || !date || !time || !venue || !description || !capacity) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned event image (validation fail):", file.filename, unlinkErr);
          });
        });
      }
      return res.status(400).json({ error: "Missing required fields for event item." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one event image is required." });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    const imagesJson = JSON.stringify(imageUrls);
    const isFeatured = featured === 'true' || featured === true;

    let tagsJson = null;
    if (tags) {
      if (Array.isArray(tags)) {
        tagsJson = JSON.stringify(tags.map(t => String(t).trim()).filter(t => t));
      } else if (typeof tags === 'string') {
        tagsJson = JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t));
      }
    } else {
      tagsJson = JSON.stringify([]); // Store empty array if no tags
    }

    const sql = `INSERT INTO events (title, date, time, venue, image, description, featured, registrationLink, capacity, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [title, date, time, venue, imagesJson, description, isFeatured, registrationLink, capacity, tagsJson];

    con.query(sql, values, (dbErr, result) => {
      if (dbErr) {
        console.error("Database error inserting event:", dbErr);
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned event image (DB fail):", file.filename, unlinkErr);
          });
        });
        return res.status(500).json({ error: "Failed to save event item to database." });
      }
      console.log(`Event item added: ${title}, ID: ${result.insertId}`);
      res.status(201).json({
        success: true,
        message: "Event item added successfully.",
        eventId: result.insertId,
        imageUrls: imageUrls // Send relative URLs back
      });

      // Notify subscribers about new event
      const eventItem = {
        id: result.insertId,
        title,
        date,
        description
      };
      subscriptionController.notifySubscribers('event', eventItem);
    });
  });
};

const getNews = (req, res) => {
  console.log("Fetching all news items");
  const sql = "SELECT * FROM news ORDER BY date DESC, createdAt DESC";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Database error fetching news:", err);
      return res.status(500).json({ error: "Database query failed to get news." });
    }

    const newsItems = results.map(item => {
      let imageUrls = [];
      if (item.image) {
        try {
          const parsedImages = JSON.parse(item.image);
          if (Array.isArray(parsedImages)) {
            // Send full URLs to client
            imageUrls = parsedImages.map(imgPath => `${req.protocol}://${req.get("host")}${imgPath}`);
          }
        } catch (parseError) {
          console.error("Error parsing image JSON for news item ID " + item.id + ":", parseError);
          // Fallback for non-JSON string image (legacy or error)
          if (typeof item.image === 'string' && item.image.startsWith('/uploads/')) {
            imageUrls = [`${req.protocol}://${req.get("host")}${item.image}`];
          }
        }
      }

      let tagsArray = [];
      if (item.tags) {
        try {
          tagsArray = JSON.parse(item.tags);
          if (!Array.isArray(tagsArray)) tagsArray = [String(tagsArray)];
        } catch (e) {
          console.error("Error parsing tags JSON for news item ID " + item.id + ":", e);
          tagsArray = typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        }
      }

      return {
        ...item,
        image: imageUrls, // Full URLs
        tags: tagsArray,
        youtubeUrl: item.youtubeUrl || null
      };
    });

    console.log(`Successfully fetched ${newsItems.length} news items.`);
    res.json({ success: true, news: newsItems });
  });
};

const getEvents = (req, res) => {
  console.log("Fetching all event items");
  const sql = "SELECT * FROM events ORDER BY date DESC, time DESC, createdAt DESC";

  con.query(sql, (err, results) => {
    if (err) {
      console.error("Database error fetching events:", err);
      return res.status(500).json({ error: "Database query failed to get events." });
    }

    const eventItems = results.map(item => {
      // Send full URL to client
      const imageUrl = item.image ? `${req.protocol}://${req.get("host")}${item.image}` : null;

      let tagsArray = [];
      if (item.tags) {
        try {
          tagsArray = JSON.parse(item.tags);
          if (!Array.isArray(tagsArray)) tagsArray = [String(tagsArray)];
        } catch (e) {
          console.error("Error parsing tags JSON for event item ID " + item.id + ":", e);
          tagsArray = typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        }
      }
      return { ...item, image: imageUrl, tags: tagsArray }; // Full URL
    });

    console.log(`Successfully fetched ${eventItems.length} event items.`);
    res.json({ success: true, events: eventItems });
  });
};

// editNews

const editNews = (req, res) => {
  const newsId = req.params.id; // Assuming ID comes from route params like /news/:id

  // We need fs for unlinking files in case of errors.
  // Assuming 'fs' is already required in this file, e.g., const fs = require('fs');
  // If not, it should be added at the top of the file.
  // Also assuming 'uploadMultipleNewsImages' is a configured Multer middleware instance available in this scope.

  uploadMultipleNewsImages(req, res, async (err) => {
    if (err) {
      console.error("Multer error for news images (edit):", err);
      return res.status(400).json({ error: "News images upload failed (edit). Check file size and type." });
    }

    // SECURITY: Perform deep content scan (magic bytes + script detection)
    try {
      await validateUploadedFile(req, res, () => { });
      if (res.headersSent) return;
    } catch (vErr) {
      return res.status(400).json({ error: "Security validation failed. Malicious content detected in news images." });
    }

    const { title, date, category, description, featured, readTime, tags, youtubeUrl } = req.body;

    if (!newsId) {
      // Clean up uploaded files if any, as the request is invalid without an ID
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned news image (edit, no ID):", file.filename, unlinkErr);
          });
        });
      }
      return res.status(400).json({ error: "News ID is required for editing." });
    }

    const updateFields = {};
    const values = [];

    // Dynamically build the update query based on provided fields
    if (title !== undefined) { updateFields.title = title; }
    if (date !== undefined) { updateFields.date = date; }
    if (category !== undefined) { updateFields.category = category; }
    if (description !== undefined) { updateFields.description = description; }
    if (featured !== undefined) { updateFields.featured = (featured === 'true' || featured === true); }
    if (readTime !== undefined) { updateFields.readTime = readTime; }

    if (youtubeUrl !== undefined) {
      updateFields.youtubeUrl = (youtubeUrl && youtubeUrl.trim() !== '') ? youtubeUrl.trim() : null;
    }

    if (tags !== undefined) {
      let tagsJson;
      if (tags) { // handles null, empty string, etc.
        if (Array.isArray(tags)) {
          tagsJson = JSON.stringify(tags.map(t => String(t).trim()).filter(t => t));
        } else if (typeof tags === 'string') {
          // Split by comma, trim, and filter out empty strings
          tagsJson = JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t));
        } else {
          tagsJson = JSON.stringify([]); // If tags is present but not array/string (e.g. object, number)
        }
      } else { // If tags is explicitly null, empty string, or not a parsable format
        tagsJson = JSON.stringify([]);
      }
      updateFields.tags = tagsJson;
    }

    let newImageUrlsArray = null;
    if (req.files && req.files.length > 0) {
      newImageUrlsArray = req.files.map(file => `/uploads/${file.filename}`);
      updateFields.image = JSON.stringify(newImageUrlsArray);
      // Note: Logic to delete old images from the filesystem could be added here.
      // This would involve fetching the current news item's image paths before updating the DB,
      // then unlinking those old files after a successful DB update.
    }

    if (Object.keys(updateFields).length === 0) {
      // No data fields to update, and no new images uploaded.
      // If files were uploaded but no other fields changed, updateFields.image would be set.
      // So this means truly nothing to update.
      if (req.files && req.files.length > 0) { // Should not happen if updateFields.image was set
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned news image (edit, no fields to update):", file.filename, unlinkErr);
          });
        });
      }
      return res.status(400).json({ error: "No fields provided to update." });
    }

    const setClauses = Object.keys(updateFields).map(key => `${con.escapeId(key)} = ?`);
    Object.values(updateFields).forEach(val => values.push(val));

    // This check should be redundant if the previous one (Object.keys(updateFields).length === 0) is correct
    if (setClauses.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting orphaned news image (edit, no SET clauses):", file.filename, unlinkErr);
        }));
      }
      return res.status(400).json({ error: "No valid fields to update." });
    }

    values.push(newsId); // For the WHERE clause

    const sql = `UPDATE news SET ${setClauses.join(", ")} WHERE id = ?`;

    con.query(sql, values, (dbErr, result) => {
      if (dbErr) {
        console.error("Database error updating news:", dbErr);
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlink(file.path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting orphaned news image (edit, DB fail):", file.filename, unlinkErr);
            });
          });
        }
        return res.status(500).json({ error: "Failed to update news item in database." });
      }

      if (result.affectedRows === 0) {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlink(file.path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting orphaned news image (edit, news not found/no change):", file.filename, unlinkErr);
            });
          });
        }
        return res.status(404).json({ error: "News item not found or no changes made." });
      }

      console.log(`News item updated: ID ${newsId}`);
      const responsePayload = {
        success: true,
        message: "News item updated successfully.",
        newsId: newsId,
      };
      if (newImageUrlsArray) {
        responsePayload.imageUrls = newImageUrlsArray;
      }
      // To return the full updated object, you might need to fetch it again.
      res.status(200).json(responsePayload);
    });
  });
};


const deleteNews = (req, res) => {
  const newsId = req.params.id;
  console.log(`Attempting to delete news item with ID: ${newsId}`);

  const selectSql = "SELECT image FROM news WHERE id = ?";
  con.query(selectSql, [newsId], (err, results) => {
    if (err) {
      console.error("Database error fetching news for deletion:", err);
      return res.status(500).json({ error: "Database query failed to fetch news details." });
    }
    if (results.length === 0) {
      console.log(`News item with ID ${newsId} not found for deletion.`);
      return res.status(404).json({ error: "News item not found." });
    }

    const imagePathsRaw = results[0].image;
    let imagePathsToDelete = [];
    if (imagePathsRaw) {
      try {
        const parsed = JSON.parse(imagePathsRaw);
        imagePathsToDelete = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      } catch (e) {
        if (typeof imagePathsRaw === 'string') { // Fallback for non-JSON string
          imagePathsToDelete = [imagePathsRaw];
        }
        console.warn("Could not parse image JSON for news item ID " + newsId + " during deletion, attempting as single string if applicable.");
      }
    }

    const deleteSql = "DELETE FROM news WHERE id = ?";
    con.query(deleteSql, [newsId], (deleteDbErr, deleteResult) => {
      if (deleteDbErr) {
        console.error("Database error deleting news:", deleteDbErr);
        return res.status(500).json({ error: "Database query failed to delete news." });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "News item not found (already deleted?)." });
      }

      if (imagePathsToDelete.length > 0) {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        imagePathsToDelete.forEach(imgPath => {
          if (imgPath && typeof imgPath === 'string') {
            const normalizedPath = path.normalize(imgPath).replace(/^(\.\.(\/|\\|$))+/, '').replace(/\\/g, '/');
            const relativePath = normalizedPath.startsWith('/uploads/') ? normalizedPath.slice(9) : normalizedPath.replace(/^\/+/, '');
            const fullPath = path.join(uploadsDir, relativePath);

            if (fullPath.startsWith(uploadsDir)) {
              fs.unlink(fullPath, unlinkErr => {
                if (unlinkErr) {
                  if (unlinkErr.code !== 'ENOENT') console.error(`Error deleting news image file ${fullPath}:`, unlinkErr);
                } else {
                  console.log(`Successfully deleted news image file: ${fullPath}`);
                }
              });
            }
          }
        });
      }
      console.log(`News item ${newsId} deleted successfully.`);
      res.json({ success: true, message: "News item deleted successfully." });
    });
  });
};

const deleteEvent = (req, res) => {
  const eventId = req.params.id;
  console.log(`Attempting to delete event item with ID: ${eventId}`);

  const selectSql = "SELECT image FROM events WHERE id = ?";
  con.query(selectSql, [eventId], (err, results) => {
    if (err) {
      console.error("Database error fetching event for deletion:", err);
      return res.status(500).json({ error: "Database query failed to fetch event details." });
    }
    if (results.length === 0) {
      console.log(`Event item with ID ${eventId} not found for deletion.`);
      return res.status(404).json({ error: "Event item not found." });
    }

    const imagePathToDelete = results[0].image;

    const deleteSql = "DELETE FROM events WHERE id = ?";
    con.query(deleteSql, [eventId], (deleteDbErr, deleteResult) => {
      if (deleteDbErr) {
        console.error("Database error deleting event:", deleteDbErr);
        return res.status(500).json({ error: "Database query failed to delete event." });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Event item not found (already deleted?)." });
      }

      if (imagePathToDelete && typeof imagePathToDelete === 'string') {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const normalizedPath = path.normalize(imagePathToDelete).replace(/^(\.\.(\/|\\|$))+/, '').replace(/\\/g, '/');
        const relativePath = normalizedPath.startsWith('/uploads/') ? normalizedPath.slice(9) : normalizedPath.replace(/^\/+/, '');
        const fullPath = path.join(uploadsDir, relativePath);

        if (fullPath.startsWith(uploadsDir)) {
          fs.unlink(fullPath, unlinkErr => {
            if (unlinkErr) {
              if (unlinkErr.code !== 'ENOENT') console.error(`Error deleting event image file ${fullPath}:`, unlinkErr);
            } else {
              console.log(`Successfully deleted event image file: ${fullPath}`);
            }
          });
        }
      }
      console.log(`Event item ${eventId} deleted successfully.`);
      res.json({ success: true, message: "Event item deleted successfully." });
    });
  });
};

// edit events
const editEvent = (req, res) => {
  const eventId = req.params.id;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  // First, fetch the current event details to get the old image path
  const selectSql = "SELECT image FROM events WHERE id = ?";
  con.query(selectSql, [eventId], (err, results) => {
    if (err) {
      console.error("Database error fetching event for edit:", err);
      return res.status(500).json({ error: "Failed to fetch event details for update." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }
    const oldImageUrl = results[0].image;

    uploadNewsEventImage(req, res, async (uploadErr) => {
      if (uploadErr) {
        console.error("Multer error for event image update:", uploadErr);
        return res.status(400).json({ error: "Event image update failed. Ensure the file is a valid image under 5MB." });
      }

      // SECURITY: Perform deep content scan (magic bytes + script detection)
      try {
        await validateUploadedFile(req, res, () => { });
        if (res.headersSent) return;
      } catch (vErr) {
        return res.status(400).json({ error: "Security validation failed. Malicious content detected in event image." });
      }

      const { title, date, time, venue, description, featured, registrationLink, capacity, tags } = req.body;

      // Validate required fields (image is optional for update)
      if (!title || !date || !time || !venue || !description || (capacity === undefined || capacity === null)) {
        if (req.file) { // If a new file was uploaded during a failed validation
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting newly uploaded event image (validation fail):", req.file.filename, unlinkErr);
          });
        }
        return res.status(400).json({ error: "Missing required fields for event item (title, date, time, venue, description, capacity)." });
      }

      let newImageUrl;
      if (req.file) {
        newImageUrl = `/uploads/${req.file.filename}`; // Store relative path for the new image
      } else {
        newImageUrl = oldImageUrl; // Keep the old image if no new one is uploaded
      }

      const isFeatured = featured === 'true' || featured === true;

      let tagsJson = null;
      // Process tags similar to postEvent: if tags are provided, use them; otherwise, they become an empty array.
      // This means to clear tags, send empty `tags`. To keep tags, client must resend current tags.
      if (tags) {
        if (Array.isArray(tags)) {
          tagsJson = JSON.stringify(tags.map(t => String(t).trim()).filter(t => t));
        } else if (typeof tags === 'string') {
          // Handle comma-separated string for tags, ensuring no empty strings after split/trim
          const processedTags = tags.split(',').map(t => t.trim()).filter(t => t);
          tagsJson = JSON.stringify(processedTags);
        } else {
          tagsJson = JSON.stringify([]); // If tags is present but not array/string, default to empty
        }
      } else {
        tagsJson = JSON.stringify([]); // Store empty array if 'tags' field is not in req.body or is falsy
      }

      const updateSql = `UPDATE events SET title = ?, date = ?, time = ?, venue = ?, image = ?, description = ?, featured = ?, registrationLink = ?, capacity = ?, tags = ? WHERE id = ?`;
      const values = [title, date, time, venue, newImageUrl, description, isFeatured, registrationLink, capacity, tagsJson, eventId];

      con.query(updateSql, values, (dbErr, result) => {
        if (dbErr) {
          console.error("Database error updating event:", dbErr);
          if (req.file) { // If a new image was uploaded and DB update failed, delete the new image
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting newly uploaded event image (DB fail):", req.file.filename, unlinkErr);
            });
          }
          return res.status(500).json({ error: "Failed to update event item in database." });
        }

        if (result.affectedRows === 0) {
          // This case might happen if the eventId was valid initially but deleted before update, or no actual data changed.
          if (req.file) { // If a new image was uploaded but no rows were affected
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting newly uploaded event image (no rows affected):", req.file.filename, unlinkErr);
            });
          }
          // It's debatable whether this should be 404 or 200 with a specific message.
          // For consistency with initial fetch, 404 if ID seems to be the issue.
          return res.status(404).json({ error: "Event not found or no changes made that would affect rows." });
        }

        // If a new image was uploaded successfully and it's different from the old one, delete the old image file
        if (req.file && oldImageUrl && oldImageUrl !== newImageUrl) {
          // Construct the file system path for the old image.
          // Assumes 'uploads' directory is at the project root.
          // oldImageUrl is stored like "/uploads/image.jpg"
          const oldImageFilePath = path.join(process.cwd(), oldImageUrl);
          fs.unlink(oldImageFilePath, (unlinkErr) => {
            if (unlinkErr) {
              // Log error but don't fail the request, as the main operation (DB update) succeeded.
              console.error("Error deleting old event image:", oldImageFilePath, unlinkErr);
            } else {
              console.log("Old event image deleted successfully:", oldImageFilePath);
            }
          });
        }

        console.log(`Event item updated: ${title}, ID: ${eventId}`);
        res.status(200).json({
          success: true,
          message: "Event item updated successfully.",
          eventId: eventId,
          imageUrl: newImageUrl // Send relative URL of the (potentially new) image
        });
      });
    });
  });
};
// media



const mediaUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit for batch uploads
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
}).fields([
  { name: 'mediaFile', maxCount: 20 }, // Increased maxCount for multiple images
  { name: 'posterFile', maxCount: 1 }
]);


// --- Controller for Adding Media Item ---
// POST /api/media
const addMediaItem = (req, res) => {
  mediaUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ success: false, message: 'File upload error.' });
    } else if (err) {
      console.error('Unknown file upload error:', err);
      return res.status(400).json({ success: false, message: 'File upload failed.' });
    }

    // SECURITY: Perform deep content scan (magic bytes + script detection)
    try {
      await validateUploadedFile(req, res, () => { });
      if (res.headersSent) return;
    } catch (vErr) {
      return res.status(400).json({ error: "Security validation failed. Malicious content detected in media files." });
    }

    const { title, date, category, type, description, src, youtubeUrl } = req.body;

    if (!title || !date || !category || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, date, category, or type.' });
    }

    let posterSrc = null;
    if (req.files && req.files.posterFile && req.files.posterFile.length > 0) {
      posterSrc = `/uploads/${req.files.posterFile[0].filename}`;
    }

    if (type === 'image') {
      if (!req.files || !req.files.mediaFile || req.files.mediaFile.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one image file is required for type "image".' });
      }

      const mediaFiles = req.files.mediaFile;
      const insertSql = `
        INSERT INTO media_gallery (title, date, category, type, description, src, poster, youtube_url_original)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      let processedCount = 0;
      let errorCount = 0;
      const insertedItems = [];

      for (const file of mediaFiles) {
        const imageUrl = `/uploads/${file.filename}`;
        const values = [title, date, category, type, description || null, imageUrl, posterSrc, null];

        try {
          const result = await new Promise((resolve, reject) => {
            con.query(insertSql, values, (dbErr, res) => {
              if (dbErr) reject(dbErr);
              else resolve(res);
            });
          });
          insertedItems.push({
            id: result.insertId,
            title,
            date,
            category,
            type,
            src: imageUrl,
            poster: posterSrc
          });
          processedCount++;
        } catch (dbErr) {
          console.error('Database error on adding multiple media items:', dbErr);
          errorCount++;
          // Unlink file if DB insert fails
          fs.unlink(file.path, (uErr) => { if (uErr) console.error("Unlink error:", uErr); });
        }
      }

      return res.status(processedCount > 0 ? 201 : 500).json({
        success: processedCount > 0,
        message: `${processedCount} media items added successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
        items: insertedItems
      });

    } else if (type === 'video') {
      if (!src) {
        return res.status(400).json({ success: false, message: 'YouTube embed URL (src) is required for type "video".' });
      }

      const sql = `
        INSERT INTO media_gallery (title, date, category, type, description, src, poster, youtube_url_original)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [title, date, category, type, description || null, src, posterSrc, youtubeUrl || null];

      con.query(sql, values, (dbErr, result) => {
        if (dbErr) {
          console.error('Database error on adding video media item:', dbErr);
          return res.status(500).json({ success: false, message: 'Failed to add video to database.' });
        }

        res.status(201).json({
          success: true,
          message: 'Video media item added successfully!',
          id: result.insertId,
          title, date, category, type, src, poster: posterSrc
        });
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid media type specified.' });
    }
  });
};

// getMediaItems, updateMediaItem, deleteMediaItem
const deleteFileByUrlPath = (fileUrlPath) => {
  if (fileUrlPath && typeof fileUrlPath === 'string' && !fileUrlPath.startsWith('http')) {
    // Prevent Path Traversal by normalizing and ensuring it's within the uploads directory
    const normalizedPath = path.normalize(fileUrlPath).replace(/^(\.\.(\/|\\|$))+/, '').replace(/\\/g, '/');
    const relativePath = normalizedPath.startsWith('/uploads/') ? normalizedPath.slice(9) : normalizedPath.replace(/^\/+/, '');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, relativePath);

    // Security check: Ensure the resolved path is still under the uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      console.warn(`Blocked potential path traversal attempt to delete: ${filePath}`);
      return;
    }
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });
  }
};

// GET /api/media (adjust route as needed)
const getMediaItems = (req, res) => {
  const sql = `
    SELECT id, title, date, category, type, description, src, poster, youtube_url_original AS youtubeUrl 
    FROM media_gallery 
    ORDER BY date DESC
  `;
  con.query(sql, (dbErr, results) => {
    if (dbErr) {
      console.error('Database error on fetching media items:', dbErr);
      return res.status(500).json({ success: false, message: 'Failed to retrieve media items.' });
    }
    res.status(200).json({ success: true, mediaItems: results });
  });
};

// PUT /api/media/:id (adjust route as needed)
const updateMediaItem = (req, res) => {
  mediaUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error during update:', err);
      return res.status(400).json({ success: false, message: 'File upload error.' });
    } else if (err) {
      console.error('Unknown file upload error during update:', err);
      return res.status(400).json({ success: false, message: 'File upload failed.' });
    }

    const { id } = req.params;
    const { title, date, category, type, description, src, youtubeUrl } = req.body;

    if (!title || !date || !category || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, date, category, or type.' });
    }

    // Fetch existing item to manage old files
    con.query('SELECT * FROM media_gallery WHERE id = ?', [id], (fetchErr, rows) => {
      if (fetchErr) {
        console.error('Database error fetching item for update:', fetchErr);
        return res.status(500).json({ success: false, message: 'Error fetching media item for update.' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Media item not found.' });
      }
      const existingItem = rows[0];
      let oldimageUrlPath = existingItem.type === 'image' ? existingItem.src : null;
      let oldPosterSrcPath = existingItem.poster;

      let newimageUrl = existingItem.src;
      let newPosterSrc = existingItem.poster;
      let newOriginalYoutubeUrl = type === 'video' ? youtubeUrl : null;

      // Handle mediaFile (main content: image or video URL)
      if (type === 'image') {
        if (req.files && req.files.mediaFile && req.files.mediaFile.length > 0) {
          newimageUrl = `/uploads/${req.files.mediaFile[0].filename}`;
        } else if (!existingItem.src && type === 'image') { // New image type item must have file or existing src
          // If type was already image and no new file is uploaded, newimageUrl remains existingItem.src
          // If type changes to image, and no file is uploaded, it's an error if there's no existing src.
          // However, if type changes to image, a new file *should* be uploaded.
          // This logic assumes if type is 'image', src must be a file path.
        }
        newOriginalYoutubeUrl = null; // Images don't have a YouTube URL
      } else if (type === 'video') {
        if (!src) { // src from frontend is the embed URL for video
          // If type was video and src is not provided, keep existing src.
          // If type changes to video and src is not provided, it's an error.
          if (existingItem.type !== 'video' || !existingItem.src) {
            // Cleanup newly uploaded files if any, before sending error
            if (req.files && req.files.mediaFile) fs.unlink(req.files.mediaFile[0].path, e => e && console.error("Cleanup error mediaFile:", e));
            if (req.files && req.files.posterFile) fs.unlink(req.files.posterFile[0].path, e => e && console.error("Cleanup error posterFile:", e));
            return res.status(400).json({ success: false, message: 'YouTube embed URL (src) is required for type "video".' });
          }
        } else {
          newimageUrl = src; // Use the new embed URL
        }
        // newOriginalYoutubeUrl is already set from req.body.youtubeUrl
      } else {
        // Cleanup newly uploaded files if any, before sending error
        if (req.files && req.files.mediaFile) fs.unlink(req.files.mediaFile[0].path, e => e && console.error("Cleanup error mediaFile:", e));
        if (req.files && req.files.posterFile) fs.unlink(req.files.posterFile[0].path, e => e && console.error("Cleanup error posterFile:", e));
        return res.status(400).json({ success: false, message: 'Invalid media type specified.' });
      }

      // Handle optional posterFile
      if (req.files && req.files.posterFile && req.files.posterFile.length > 0) {
        newPosterSrc = `/uploads/${req.files.posterFile[0].filename}`;
      }

      const updateSql = `
        UPDATE media_gallery 
        SET title = ?, date = ?, category = ?, type = ?, description = ?, src = ?, poster = ?, youtube_url_original = ?
        WHERE id = ?
      `;
      const values = [title, date, category, type, description || null, newimageUrl, newPosterSrc, newOriginalYoutubeUrl, id];

      con.query(updateSql, values, (dbErr, result) => {
        if (dbErr) {
          console.error('Database error on updating media item:', dbErr);
          // Cleanup newly uploaded files if DB update fails
          if (req.files && req.files.mediaFile && newimageUrl.includes(req.files.mediaFile[0].filename)) {
            fs.unlink(req.files.mediaFile[0].path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting new mediaFile after DB error:", unlinkErr);
            });
          }
          if (req.files && req.files.posterFile && newPosterSrc.includes(req.files.posterFile[0].filename)) {
            fs.unlink(req.files.posterFile[0].path, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting new posterFile after DB error:", unlinkErr);
            });
          }
          return res.status(500).json({ success: false, message: 'Failed to update media item in database.' });
        }

        // If update successful, delete old files if they were replaced
        if (type === 'image' && oldimageUrlPath && newimageUrl !== oldimageUrlPath) {
          deleteFileByUrlPath(oldimageUrlPath);
        } else if (existingItem.type === 'image' && type === 'video' && oldimageUrlPath) {
          // Type changed from image to video, delete old image
          deleteFileByUrlPath(oldimageUrlPath);
        }

        if (oldPosterSrcPath && newPosterSrc !== oldPosterSrcPath) {
          deleteFileByUrlPath(oldPosterSrcPath);
        }

        const updatedMediaItem = {
          id: parseInt(id), title, date, category, type, description: description || null,
          src: newimageUrl, poster: newPosterSrc, youtubeUrl: newOriginalYoutubeUrl
        };

        res.status(200).json({
          success: true,
          message: 'Media item updated successfully!',
          ...updatedMediaItem
        });
      });
    });
  });
};

// DELETE /api/media/:id (adjust route as needed)
const deleteMediaItem = (req, res) => {
  const { id } = req.params;

  // First, fetch the item to get file paths for deletion
  con.query('SELECT src, poster, type FROM media_gallery WHERE id = ?', [id], (fetchErr, rows) => {
    if (fetchErr) {
      console.error('Database error fetching item for deletion:', fetchErr);
      return res.status(500).json({ success: false, message: 'Error fetching media item for deletion.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Media item not found.' });
    }
    const itemToDelete = rows[0];

    const deleteSql = 'DELETE FROM media_gallery WHERE id = ?';
    con.query(deleteSql, [id], (dbErr, result) => {
      if (dbErr) {
        console.error('Database error on deleting media item:', dbErr);
        return res.status(500).json({ success: false, message: 'Failed to delete media item from database.' });
      }
      if (result.affectedRows === 0) {
        // Should have been caught by the fetch earlier, but as a safeguard
        return res.status(404).json({ success: false, message: 'Media item not found or already deleted.' });
      }

      // If DB deletion successful, delete associated files
      if (itemToDelete.type === 'image' && itemToDelete.src) {
        deleteFileByUrlPath(itemToDelete.src);
      }
      if (itemToDelete.poster) {
        deleteFileByUrlPath(itemToDelete.poster);
      }

      res.status(200).json({ success: true, message: 'Media item deleted successfully.' });
    });
  });
};



// Assuming 'con' is your database connection (e.g., from mysql.createConnection())
// and this file is part of an Express router setup.
// Example: const express = require('express');
//          const router = express.Router();
//          const con = require('../db-connection'); // Your DB connection

const postComment = async (req, res) => {
  const { newsItemId } = req.params; // Extract newsItemId from URL parameters
  const { name, email, text, parentId } = req.body; // parentId is optional for replies

  // Validate required fields
  if (!newsItemId || !name || !email || !text) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: newsItemId, name, email, and text are required."
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: "Invalid email format." });
  }

  const sql = `
    INSERT INTO comments (news_item_id, parent_id, name, email, text, approved) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  // 'approved' is set to false (0) by default, awaiting admin review.
  const values = [newsItemId, parentId || null, name, email, text, false];

  con.query(sql, values, (dbErr, result) => {
    if (dbErr) {
      console.error("Database error inserting comment:", dbErr);
      return res.status(500).json({ success: false, error: "Failed to save comment to database." });
    }

    const insertedCommentId = result.insertId;
    const createdAt = new Date().toISOString(); // Get current timestamp in ISO format

    // Construct the comment object to return, matching the frontend's Comment interface
    const newComment = {
      id: String(insertedCommentId), // Convert ID to string to match frontend interface
      newsItemId: String(newsItemId), // Ensure newsItemId is a string
      name,
      email,
      text,
      date: createdAt,
      parentId: parentId ? String(parentId) : null, // Convert parentId to string if it exists
      approved: false, // Newly created comments are not yet approved
      replies: [], // New comments don't have replies yet
    };

    console.log(`Comment added for news item ${newsItemId}, Comment ID: ${insertedCommentId}`);
    res.status(201).json({
      success: true,
      message: "Comment added successfully. It will be visible after admin approval.",
      comment: newComment
    });
  });
};

// To use this in your Express app, you would typically do something like:
// router.post('/news/:newsItemId/comments', postComment);
// module.exports = router; // or module.exports = { postComment };

// --- Database Schema for 'comments' table (MySQL example) ---
/*
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  news_item_id INT NOT NULL, -- Or the appropriate type for your news item IDs
  parent_id INT NULL,        -- For replies, references comments.id
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved BOOLEAN DEFAULT FALSE, -- Or TINYINT(1) DEFAULT 0
  -- Optional: Fields for admin approval tracking
  -- approved_by INT NULL,      -- FK to an admin users table
  -- approved_at TIMESTAMP NULL,
  FOREIGN KEY (news_item_id) REFERENCES news(id) ON DELETE CASCADE, -- Assuming 'news' is your news table
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);
*/

const structureComments = (commentsList) => {
  const commentMap = {};
  const rootComments = [];

  // First pass: create a map of comments and initialize replies array
  commentsList.forEach(comment => {
    const formattedComment = {
      id: String(comment.id),
      newsItemId: String(comment.news_item_id),
      name: comment.name,
      email: comment.email, // Consider if email should be exposed on GET requests
      text: comment.text,
      date: new Date(comment.created_at).toISOString(),
      parentId: comment.parent_id ? String(comment.parent_id) : null,
      approved: comment.approved,
      replies: [],
    };
    commentMap[formattedComment.id] = formattedComment;
  });

  // Second pass: build the hierarchy
  commentsList.forEach(comment => {
    const currentComment = commentMap[String(comment.id)];
    if (currentComment.parentId && commentMap[currentComment.parentId]) {
      commentMap[currentComment.parentId].replies.push(currentComment);
    } else {
      rootComments.push(currentComment);
    }
  });
  return rootComments;
};

/**
 * Fetches all approved comments for a given news item, structured with replies.
 */
const getCommentsByNewsItemId = async (req, res) => {
  const { newsItemId } = req.params;

  if (!newsItemId) {
    return res.status(400).json({ success: false, error: "Missing newsItemId parameter." });
  }

  const sql = `
    SELECT id, news_item_id, parent_id, name, email, text, created_at, approved 
    FROM comments 
    WHERE news_item_id = ? AND approved = ? 
    ORDER BY created_at ASC
  `;
  // Fetch only approved comments (approved = true or 1)
  con.query(sql, [newsItemId, true], (dbErr, results) => {
    if (dbErr) {
      console.error("Database error fetching comments:", dbErr);
      return res.status(500).json({ success: false, error: "Failed to fetch comments." });
    }

    const structuredComments = structureComments(results);
    res.status(200).json({ success: true, comments: structuredComments });
  });
};


const getCommentsByNewsItemIdf = async (req, res) => {
  const { newsItemId } = req.params;

  if (!newsItemId) {
    return res.status(400).json({ success: false, error: "Missing newsItemId parameter." });
  }

  const sql = `
    SELECT id, news_item_id, parent_id, name, email, text, created_at, approved 
    FROM comments 
    WHERE news_item_id = ? AND approved = ? 
    ORDER BY created_at ASC
  `;
  // Fetch only approved comments (approved = true or 1)
  con.query(sql, [newsItemId, true], (dbErr, results) => {
    if (dbErr) {
      console.error("Database error fetching comments:", dbErr);
      return res.status(500).json({ success: false, error: "Failed to fetch comments." });
    }

    const structuredComments = structureComments(results);
    res.status(200).json({ success: true, comments: structuredComments });
  });
};
/**
 * Approves a pending comment.
 */
const approveComment = async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ success: false, error: "Missing commentId parameter." });
  }

  const sql = "UPDATE comments SET approved = ? WHERE id = ?";
  // Set approved to true (or 1)
  con.query(sql, [true, commentId], (dbErr, result) => {
    if (dbErr) {
      console.error("Database error approving comment:", dbErr);
      return res.status(500).json({ success: false, error: "Failed to approve comment." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Comment not found or no change needed." });
    }
    res.status(200).json({ success: true, message: "Comment approved successfully." });
  });
};

/**
 * Deletes a comment.
 * Note: This implementation deletes a specific comment.
 * Depending on your database schema (e.g., ON DELETE CASCADE for parent_id),
 * replies might be automatically deleted. If not, you may need to handle replies explicitly.
 */
const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ success: false, error: "Missing commentId parameter." });
  }

  const sql = "DELETE FROM comments WHERE id = ?";
  con.query(sql, [commentId], (dbErr, result) => {
    if (dbErr) {
      console.error("Database error deleting comment:", dbErr);
      // This error could also be due to foreign key constraints if replies exist and ON DELETE CASCADE is not set.
      return res.status(500).json({ success: false, error: "Failed to delete comment. Ensure replies are handled if necessary." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Comment not found." });
    }
    res.status(200).json({ success: true, message: "Comment deleted successfully." });
  });
};

module.exports = {
  getCommentsByNewsItemId,
  getCommentsByNewsItemIdf,
  approveComment,
  deleteComment,
  postComment,
  getMediaItems,
  updateMediaItem,
  deleteMediaItem,
  addMediaItem,
  uploadProfilePicture,
  getProfilePicture,
  postNews,
  getNews,
  postEvent,
  getEvents,
  editNews,
  editEvent,
  deleteNews,
  deleteEvent
};
