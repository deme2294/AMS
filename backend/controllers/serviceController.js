// controllers/serviceController.js
// Handles all operations for Service Categories and Services

const con = require("../models/db");
const { generateReferenceNumber } = require("./queueController");

// ================================================
// SERVICE CATEGORIES CONTROLLER
// ================================================

// Get all service categories (with optional filters)
const getServiceCategories = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = `
            SELECT sc.*
            FROM service_categories sc
        `;
        const params = [];

        // Build WHERE clause dynamically
        const conditions = [];
        if (status) {
            conditions.push("sc.status = ?");
            params.push(status);
        }
        if (search) {
            conditions.push("(sc.category_name LIKE ? OR sc.description LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY sc.created_at DESC";

        const [categories] = await con.promise().query(query, params);

        return res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        console.error("Error fetching service categories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service categories",
            error: error.message
        });
    }
};

// Get single service category by ID
const getServiceCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [categories] = await con.promise().query(
            `SELECT sc.*
             FROM service_categories sc
             WHERE sc.id = ?`,
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service category not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: categories[0]
        });
    } catch (error) {
        console.error("Error fetching service category:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service category",
            error: error.message
        });
    }
};

// Create a new service category
const createServiceCategory = async (req, res) => {
    try {
        const { category_name, description, status } = req.body;
        const created_by = req.user.user_id;

        // Validation
        if (!category_name || category_name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        // Check for duplicate
        const [existing] = await con.promise().query(
            "SELECT id FROM service_categories WHERE category_name = ?",
            [category_name.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Category with this name already exists"
            });
        }

        let categoryImage = null;
        if (req.file) {
            categoryImage = `/uploads/service-categories/${req.file.filename}`;
        }

        // Insert
        const [result] = await con.promise().query(
            `INSERT INTO service_categories 
             (category_name, description, category_image, status) 
             VALUES (?, ?, ?, ?)`,
            [
                category_name.trim(),
                description || null,
                categoryImage,
                status || 'active'
            ]
        );

        // Fetch the created record
        const [newCategory] = await con.promise().query(
            "SELECT * FROM service_categories WHERE id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Service category created successfully",
            data: newCategory[0]
        });
    } catch (error) {
        console.error("Error creating service category:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create service category",
            error: error.message
        });
    }
};

// Update a service category
const updateServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description, status } = req.body;

        // Check exists
        const [existing] = await con.promise().query(
            "SELECT * FROM service_categories WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service category not found"
            });
        }

        // Check duplicate name if changed
        if (category_name && category_name !== existing[0].category_name) {
            const [duplicate] = await con.promise().query(
                "SELECT id FROM service_categories WHERE category_name = ? AND id != ?",
                [category_name, id]
            );
            if (duplicate.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Category with this name already exists"
                });
            }
        }

        // Handle image upload - if new file provided, use it; otherwise keep existing
        // Important: multer middleware uses field name 'image'
        let categoryImage = existing[0].category_image;
        if (req.file) {
            categoryImage = `/uploads/service-categories/${req.file.filename}`;
        }

        // DEBUG log (helps diagnose "Failed to update service category")
        // NOTE: left in place for server logs.
        console.log('[updateServiceCategory] id:', id, 'req.file:', !!req.file, 'categoryImage:', categoryImage);


        // Update
        await con.promise().query(
            `UPDATE service_categories 
             SET category_name = ?, description = ?, category_image = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                category_name || existing[0].category_name,
                description !== undefined ? description : existing[0].description,
                categoryImage,
                status || existing[0].status,
                id
            ]
        );

        // Propagate category_image to services so service cards show the latest image.
        // Uses service_categories.category_image column.
        const oldCategoryImage = existing[0].category_image;
        const newCategoryImage = categoryImage;

        if (newCategoryImage && newCategoryImage !== oldCategoryImage) {
            await con.promise().query(
                `UPDATE services 
                 SET service_image = ?
                 WHERE category_id = ?`,
                [newCategoryImage, id]
            );
        }

        // Also fill missing service_image for older rows
        if (newCategoryImage) {
            await con.promise().query(
                `UPDATE services 
                 SET service_image = ?
                 WHERE category_id = ? AND (service_image IS NULL OR service_image = '')`,
                [newCategoryImage, id]
            );
        }

        // Fetch updated
        const [updated] = await con.promise().query(
            "SELECT * FROM service_categories WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Service category updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating service category:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update service category",
            error: error.message
        });
    }
};

// Delete a service category
const deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check exists
        const [existing] = await con.promise().query(
            "SELECT * FROM service_categories WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service category not found"
            });
        }

        // Check for dependent services
        const [services] = await con.promise().query(
            "SELECT COUNT as count FROM services WHERE category_id = ?",
            [id]
        );

        if (services[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${services[0].count} service(s) are using this category.`
            });
        }

        // Delete
        await con.promise().query(
            "DELETE FROM service_categories WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Service category deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting service category:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete service category",
            error: error.message
        });
    }
};

// ================================================
// SERVICES CONTROLLER
// ================================================

// Get all services for public (no auth required) - only active services
const getServicesPublic = async (req, res) => {
    try {
        const {
            category,
            featured,
            search
        } = req.query;

        let query = `
            SELECT s.*, sc.category_name, e.name as barber_name
            FROM services s
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN employees e ON s.barber_id = e.employee_id
        `;
        const params = [];



        // Build WHERE clause for public access (only active and available)
        const conditions = ["s.is_available = 1", "s.status = 'active'"];

        // Filters
        if (category) {
            conditions.push("s.category_id = ?");
            params.push(category);
        }
        if (featured === 'true' || featured === true) {
            conditions.push("s.is_featured = 1");
        }
        if (search) {
            conditions.push("(s.service_name LIKE ? OR s.description LIKE ? OR sc.category_name LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY s.is_featured DESC, s.created_at DESC";

        const [services] = await con.promise().query(query, params);

        return res.status(200).json({
            success: true,
            data: services,
            total: services.length
        });
    } catch (error) {
        console.error("Error fetching public services:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: error.message
        });
    }
};

// Get all services (with optional filters) - authenticated
const getServices = async (req, res) => {
    try {
        const {
            category,
            featured,
            available,
            barber_id,
            search,
            service_type,
            created_by,
            limit = 50,
            offset = 0
        } = req.query;

        let query = `
            SELECT 
                s.*,
                sc.category_name,
                e.name as barber_name,
                u.user_name as created_by_name
            FROM services s
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN employees e ON s.barber_id = e.employee_id
            LEFT JOIN users u ON s.created_by = u.user_id
        `;

        const params = [];
        const conditions = [];

        // For public endpoint, only show active services
        const isPublicEndpoint = req.path && req.path.startsWith('/public');
        if (isPublicEndpoint) {
            conditions.push("s.is_available = 1");
            conditions.push("s.status = 'active'");
        }

        // Filters
        if (category) {
            conditions.push("s.category_id = ?");
            params.push(category);
        }
        if (featured === 'true') {
            conditions.push("s.is_featured = 1");
        }
        if (available !== undefined && !isPublicEndpoint) {
            conditions.push("s.is_available = ?");
            params.push(available === 'true' ? 1 : 0);
        }
        if (barber_id) {
            conditions.push("s.barber_id = ?");
            params.push(barber_id);
        }
        if (service_type) {
            conditions.push("s.service_type = ?");
            params.push(service_type);
        }
        if (created_by) {
            conditions.push("s.created_by = ?");
            params.push(created_by);
        }
        if (search) {
            conditions.push("(s.service_name LIKE ? OR s.description LIKE ? OR sc.category_name LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY s.is_featured DESC, s.created_at DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [services] = await con.promise().query(query, params);

        // Get total count for pagination
        let countQuery = "SELECT COUNT(*) as total FROM services s";
        const countParamsArr = [];

        if (conditions.length > 0) {
            const cleanConditions = conditions.filter(c => !c.includes("ORDER BY") && !c.includes("LIMIT"));
            if (cleanConditions.length > 0) {
                countQuery += " WHERE " + cleanConditions.join(" AND ");
                // Build count params based on the actual filter values (exclude limit/offset)
                countParamsArr.push(...params.slice(0, -2));
            }
        }

        const [countResult] = await con.promise().query(countQuery, countParamsArr);

        return res.status(200).json({
            success: true,
            data: services,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: error.message
        });
    }
};

// Get single service by ID
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const [services] = await con.promise().query(
            `SELECT s.*, sc.category_name, e.name as barber_name
             FROM services s
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON s.barber_id = e.employee_id
             WHERE s.id = ?`,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: services[0]
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service",
            error: error.message
        });
    }
};

// Get single service by ID for public (only active services)
const getServiceByIdForPublic = async (req, res) => {
    try {
        const { id } = req.params;

        const [services] = await con.promise().query(
            `SELECT s.*, sc.category_name, e.name as barber_name
             FROM services s
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON s.barber_id = e.employee_id
             WHERE s.id = ? AND s.is_available = 1 AND s.status = 'active'`,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found or unavailable"
            });
        }

        return res.status(200).json({
            success: true,
            data: services[0]
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service",
            error: error.message
        });
    }
};

// Get categories for public (only active categories)
const getCategoriesForPublic = async (req, res) => {
    try {
        const { search } = req.query;

        let query = "SELECT * FROM service_categories WHERE status = 'active'";
        const params = [];

        if (search) {
            query += " AND (category_name LIKE ? OR description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY category_name ASC";

        const [categories] = await con.promise().query(query, params);

        return res.status(200).json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message
        });
    }
};

// Create a new service
const createService = async (req, res) => {
    try {
        const {
            category_id,
            barber_id,
            service_name,
            description,
            price,
            discount_price,
            duration_minutes,
            service_icon,
            is_featured,
            is_available,
            max_customers_per_slot,
            preparation_time,
            cleanup_time,
            booking_buffer_time,
            service_type,
            status
        } = req.body;

        // Normalize booleans (from FormData strings)

        const featured = is_featured === '1' || is_featured === 1 || is_featured === true;
        const available = is_available === '1' || is_available === 1 || is_available === true || is_available === undefined;

        const created_by = req.user.user_id;

        // Validation
        if (!service_name || service_name.trim() === "") {
            return res.status(400).json({ success: false, message: "Service name is required" });
        }
        if (!category_id) {
            return res.status(400).json({ success: false, message: "Category is required" });
        }
        if (!price || isNaN(parseFloat(price))) {
            return res.status(400).json({ success: false, message: "Valid price is required" });
        }
        if (!duration_minutes || isNaN(parseInt(duration_minutes))) {
            return res.status(400).json({ success: false, message: "Valid duration is required" });
        }

        // Generate slug
        const slug = service_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check for duplicate slug
        const [existing] = await con.promise().query(
            "SELECT id FROM services WHERE service_slug = ?",
            [slug]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A service with this name already exists"
            });
        }

        // Handle image upload
        // If service image is not uploaded, auto-fill from the selected category image
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/services/${req.file.filename}`;
        }

        // Fallback: copy category_image into service image when service_image is not uploaded
        if (!imagePath) {
            const [categoryRows] = await con.promise().query(
                "SELECT category_image FROM service_categories WHERE id = ? AND status = 'active'",
                [category_id]
            );
            if (categoryRows && categoryRows.length > 0 && categoryRows[0].category_image) {
                imagePath = categoryRows[0].category_image;
            }
        }



        // Insert
        const [result] = await con.promise().query(
            `INSERT INTO services (
                category_id, barber_id, service_name, service_slug, description, 
                price, discount_price, duration_minutes, service_image, service_icon,
                is_featured, is_available, max_customers_per_slot, preparation_time,
                cleanup_time, booking_buffer_time, service_type, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                barber_id || null,
                service_name.trim(),
                slug,
                description || null,
                parseFloat(price),
                discount_price ? parseFloat(discount_price) : null,
                parseInt(duration_minutes),
                imagePath,
                service_icon || null,
                featured ? 1 : 0,
                available ? 1 : 0,
                max_customers_per_slot || 1,
                preparation_time || 0,
                cleanup_time || 0,
                booking_buffer_time || 0,
                service_type || 'standard',
                status || 'active',
                created_by
            ]
        );

        const [newService] = await con.promise().query(
            `SELECT s.*, sc.category_name 
             FROM services s 
             LEFT JOIN service_categories sc ON s.category_id = sc.id 
             WHERE s.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: newService[0]
        });
    } catch (error) {
        console.error("Error creating service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create service",
            error: error.message
        });
    }
};

// Update a service
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            barber_id,
            service_name,
            description,
            price,
            discount_price,
            duration_minutes,
            service_icon,
            is_featured,
            is_available,
            max_customers_per_slot,
            preparation_time,
            cleanup_time,
            booking_buffer_time,
            service_type,
            status
        } = req.body;

        // Normalize booleans if present
        const featured = is_featured !== undefined ? (is_featured === '1' || is_featured === 1 || is_featured === true) : undefined;
        const available = is_available !== undefined ? (is_available === '1' || is_available === 1 || is_available === true) : undefined;

        // Check exists
        const [existing] = await con.promise().query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check duplicate slug if name changed
        if (service_name && service_name !== existing[0].service_name) {
            const newSlug = service_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const [duplicate] = await con.promise().query(
                "SELECT id FROM services WHERE service_slug = ? AND id != ?",
                [newSlug, id]
            );
            if (duplicate.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A service with this name already exists"
                });
            }
        }

        // Handle image upload - keep existing if no new file
        let imagePath = existing[0].service_image;
        if (req.file) {
            imagePath = `/uploads/services/${req.file.filename}`;
        }

        // Fallback: if still missing, copy from selected category_image
        if (!imagePath) {
            const categoryIdToUse = category_id !== undefined ? category_id : existing[0].category_id;
            const [categoryRows] = await con.promise().query(
                "SELECT category_image FROM service_categories WHERE id = ? AND status = 'active'",
                [categoryIdToUse]
            );
            if (categoryRows && categoryRows.length > 0 && categoryRows[0].category_image) {
                imagePath = categoryRows[0].category_image;
            }
        }


        // Build update dynamically
        const updateFields = [];
        const updateValues = [];

        if (category_id !== undefined) { updateFields.push("category_id = ?"); updateValues.push(category_id); }
        if (barber_id !== undefined) { updateFields.push("barber_id = ?"); updateValues.push(barber_id); }
        if (service_name !== undefined) {
            updateFields.push("service_name = ?, service_slug = ?");
            updateValues.push(service_name.trim(), service_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        }
        if (description !== undefined) { updateFields.push("description = ?"); updateValues.push(description); }
        if (price !== undefined) { updateFields.push("price = ?"); updateValues.push(parseFloat(price)); }
        if (discount_price !== undefined) { updateFields.push("discount_price = ?"); updateValues.push(discount_price ? parseFloat(discount_price) : null); }
        if (duration_minutes !== undefined) { updateFields.push("duration_minutes = ?"); updateValues.push(parseInt(duration_minutes)); }
        if (req.file) { updateFields.push("service_image = ?"); updateValues.push(imagePath); }
        if (service_icon !== undefined) { updateFields.push("service_icon = ?"); updateValues.push(service_icon); }
        if (featured !== undefined) { updateFields.push("is_featured = ?"); updateValues.push(featured ? 1 : 0); }
        if (available !== undefined) { updateFields.push("is_available = ?"); updateValues.push(available ? 1 : 0); }
        if (max_customers_per_slot !== undefined) { updateFields.push("max_customers_per_slot = ?"); updateValues.push(max_customers_per_slot); }
        if (preparation_time !== undefined) { updateFields.push("preparation_time = ?"); updateValues.push(preparation_time); }
        if (cleanup_time !== undefined) { updateFields.push("cleanup_time = ?"); updateValues.push(cleanup_time); }
        if (booking_buffer_time !== undefined) { updateFields.push("booking_buffer_time = ?"); updateValues.push(booking_buffer_time); }
        if (service_type !== undefined) { updateFields.push("service_type = ?"); updateValues.push(service_type); }
        if (status !== undefined) { updateFields.push("status = ?"); updateValues.push(status); }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update"
            });
        }

        updateValues.push(id);
        const updateQuery = `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`;
        await con.promise().query(updateQuery, updateValues);

        // Fetch updated
        const [updated] = await con.promise().query(
            `SELECT s.*, sc.category_name 
             FROM services s 
             LEFT JOIN service_categories sc ON s.category_id = sc.id 
             WHERE s.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update service",
            error: error.message
        });
    }
};

// Delete a service
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Check exists
        const [existing] = await con.promise().query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check for bookings
        const [bookings] = await con.promise().query(
            "SELECT COUNT(*) as count FROM service_bookings WHERE service_id = ?",
            [id]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete service. It has ${bookings[0].count} booking(s).`
            });
        }

        // Delete
        await con.promise().query("DELETE FROM services WHERE id = ?", [id]);

        return res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting service:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete service",
            error: error.message
        });
    }
};

// Toggle service availability (quick action)
const toggleServiceAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_available } = req.body;

        const [result] = await con.promise().query(
            "UPDATE services SET is_available = ?, updated_at = NOW() WHERE id = ?",
            [is_available ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        const [updated] = await con.promise().query("SELECT * FROM services WHERE id = ?", [id]);

        return res.status(200).json({
            success: true,
            message: `Service ${is_available ? 'activated' : 'deactivated'} successfully`,
            data: updated[0]
        });
    } catch (error) {
        console.error("Error toggling service availability:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle service availability",
            error: error.message
        });
    }
};

// ================================================
// BOOKING OPERATIONS
// ================================================

// Get barbers (employees with the specified role, default role_id = 2 = barber)
// Returns each employee joined with users so that `username` (from users.user_name)
// is always present alongside `full_name` (from employees.name).
const getBarbers = async (req, res) => {
    try {
        // Role_id from query param; fall back to 2 (barber) when absent/empty
        const roleId = req.query.role_id ? parseInt(req.query.role_id, 10) : 2;

        const [barbers] = await con.promise().query(
            `SELECT 
                e.employee_id AS id,
                e.name        AS full_name,
                e.email,
                e.phone,
                u.user_name   AS username
             FROM employees  e
             INNER JOIN users u ON u.employee_id = e.employee_id
             WHERE u.role_id = ?
             ORDER BY e.name ASC`,
            [roleId]
        );

        return res.status(200).json({
            success: true,
            data: barbers
        });
    } catch (error) {
        console.error("Error fetching barbers:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch barbers",
            error: error.message
        });
    }
};

// Get available time slots for a service on a given date (from persistent admin/barber availability)
const getAvailableSlots = async (req, res) => {
    try {
        const { service_id, barber_id, date } = req.query;

        if (!service_id || !date) {
            return res.status(400).json({
                success: false,
                message: "service_id and date are required"
            });
        }

        // Service details
        const [services] = await con.promise().query(
            "SELECT duration_minutes FROM services WHERE id = ? AND is_available = 1 AND status = 'active'",
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        const duration = services[0].duration_minutes;

        // Load open availability slots for that service/date.
        // If barber_id not provided, include global (barber_id IS NULL) plus barber-specific slots.
        // Capacity is enforced by counting bookings that use that availability_slot_id.
        let slotsQuery = `
            SELECT 
              aus.id as availability_slot_id,
              aus.start_time,
              aus.end_time,
              aus.max_bookings,
              aus.slot_status,
              (
                SELECT COUNT(*)
                FROM service_bookings sb
                WHERE sb.availability_slot_id = aus.id
                  AND sb.booking_status NOT IN ('cancelled','no_show')
              ) AS booked_count
            FROM availability_slots aus
            WHERE aus.service_id = ?
              AND aus.available_date = ?
              AND aus.slot_status IN ('available','open')
        `;

        const params = [service_id, date];

        if (barber_id) {
            slotsQuery += " AND (aus.barber_id = ? OR aus.barber_id IS NULL)";
            params.push(barber_id);
        }

        slotsQuery += " ORDER BY aus.start_time ASC, aus.id DESC";

        const [availabilityRows] = await con.promise().query(slotsQuery, params);

        // Return distinct start_time strings (HH:MM). Capacity enforced per availability_slot row.
        const available_slots = availabilityRows
            .filter(r => Number(r.booked_count) < Number(r.max_bookings))
            .map(r => (r.start_time || '').slice(0, 5))
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            data: {
                service: { duration_minutes: duration },
                available_slots,
                date
            }
        });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch available slots",
            error: error.message
        });
    }
};


// Create a new service booking
const createBooking = async (req, res) => {
    try {
        let {
            service_id,
            barber_id,
            booking_date,
            time_slot,
            availability_slot_id,
            customer_name,
            customer_phone,
            customer_email,
            notes
        } = req.body;

        // Validation
        if (!service_id || !booking_date || !time_slot || !customer_name || !customer_phone) {
            return res.status(400).json({
                success: false,
                message: "service_id, booking_date, time_slot, customer_name, and customer_phone are required"
            });
        }





        // Check service
        const [services] = await con.promise().query(
            "SELECT id FROM services WHERE id = ? AND is_available = 1 AND status = 'active'",
            [service_id]
        );
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        // Check barber if provided
        if (barber_id) {
            const [barbers] = await con.promise().query(
                "SELECT employee_id FROM employees WHERE employee_id = ?",
                [barber_id]
            );
            if (barbers.length === 0) {
                return res.status(404).json({ success: false, message: "Barber not found" });
            }
        }

        // Find matching open availability slot row for this service/date.
        // If availability_slot_id is provided, prefer it.
        // Otherwise fall back to (service_id, booking_date, time_slot) mapping.

        let max_bookings = null;


        // Find matching open availability slot row for this service/date.
        // For now (to keep server working), we keep the legacy behavior based on time_slot.
        // (This function is currently mid-migration for range overlap rules.)
        const params = [service_id, booking_date, time_slot];
        let slotQuery = `
            SELECT aus.id as availability_slot_id, aus.max_bookings
            FROM availability_slots aus
            WHERE aus.service_id = ?
              AND aus.available_date = ?
              AND aus.start_time = ?
              AND aus.slot_status IN ('available','open')
        `;



        if (barber_id) {
            slotQuery += ` AND (aus.barber_id = ? OR aus.barber_id IS NULL)`;
            params.push(barber_id);
        } else {
            slotQuery += ` AND aus.barber_id IS NULL`;
        }

        slotQuery += ` ORDER BY (CASE WHEN aus.barber_id = ? THEN 0 ELSE 1 END), aus.id DESC LIMIT 1`;
        if (barber_id) {
            params.push(barber_id);
        } else {
            params.push(null);
        }

        const [slots] = await con.promise().query(slotQuery, params);
        if (slots.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Selected time is no longer available. Please select another time."
            });
        }

        const selectedAvailabilitySlotId = slots[0].availability_slot_id;
        max_bookings = Number(slots[0].max_bookings || 1);

        // Keep variable name `availability_slot_id` for later use
        // If it wasn't provided in the payload, fall back to selected availability slot id.
        if (availability_slot_id === undefined || availability_slot_id === null || availability_slot_id === '') {
            availability_slot_id = selectedAvailabilitySlotId;
        }








        // Enforce capacity based on pending/approved bookings that are not cancelled/no_show.
        const [usage] = await con.promise().query(
            `SELECT COUNT(*) as cnt
             FROM service_bookings
             WHERE availability_slot_id = ?
               AND status NOT IN ('cancelled','no_show')`,
            [availability_slot_id]
        );

        if (Number(usage[0].cnt) >= max_bookings) {
            return res.status(409).json({
                success: false,
                message: "This slot reached its maximum capacity. Please select another time."
            });
        }

        // For range-based availability, block overlap for the same customer/service/date.
        // Rule (from requirement): customer can book only one overlapping time range.
        // We approximate overlap by using the selected slot's start/end and checking any existing
        // booking ranges that belong to overlapping availability slots.

        const [slotRange] = await con.promise().query(
            `SELECT start_time, end_time
           FROM availability_slots
           WHERE id = ?`,
            [availability_slot_id]
        );

        if (slotRange.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Selected availability slot is no longer available."
            });
        }

        const newStart = slotRange[0].start_time;
        const newEnd = slotRange[0].end_time;

        const customer_id = req.user ? req.user.user_id : null;

        if (customer_id) {
            const [overlaps] = await con.promise().query(
                `SELECT sb.id
             FROM service_bookings sb
             JOIN availability_slots aus ON sb.availability_slot_id = aus.id
             WHERE sb.customer_id = ?
               AND sb.service_id = ?
               AND sb.booking_date = ?
               AND sb.booking_status NOT IN ('cancelled','no_show')
               AND aus.slot_status = 'open'
               AND (
                 -- overlap: start < newEnd AND end > newStart
                 aus.start_time < ?
                 AND aus.end_time > ?
               )
             LIMIT 1`,
                [customer_id, service_id, booking_date, newEnd, newStart]
            );

            if (overlaps.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "You already have a booking that overlaps this time range. Please select another time."
                });
            }
        }

        // Get the customer_id from the logged-in user if available
        // (kept for downstream insert)
        // customer_id already set above


        // Generate reference number immediately on submission
        const reference_number = await generateReferenceNumber();

        // Insert booking (consume availability)
        const [result] = await con.promise().query(
            `INSERT INTO service_bookings 
             (service_id, barber_id, availability_slot_id, customer_name, customer_phone, customer_email, appointment_date, appointment_time, booking_note, booking_status, created_at, customer_id, reference_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?, ?)`,
            [
                service_id,
                barber_id || null,
                availability_slot_id,
                customer_name,
                customer_phone,
                customer_email || null,
                booking_date,
                time_slot,
                notes || null,
                customer_id,
                reference_number
            ]
        );

        const bookingId = result.insertId;

        // Automatically store the review in db_barber.booking_reviews table
        await con.promise().query(
            `INSERT INTO booking_reviews 
             (booking_id, customer_id, service_id, barber_id, review_status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [
                bookingId,
                customer_id || req.user.user_id,
                service_id,
                barber_id || null
            ]
        );

        // Keep backward compatibility for response-building joins/selects.
        // The frontend expects service-booking list fields that may still use legacy aliases.



        // Return created booking with service/category details
        const [newBooking] = await con.promise().query(
            `SELECT sb.*, s.service_name, s.price, sc.category_name 
             FROM service_bookings sb
             LEFT JOIN services s ON sb.service_id = s.id
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             WHERE sb.id = ?`,
            [bookingId]
        );

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: newBooking[0]
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message
        });
    }
};


// Approve a booking (admin/barber)
const approveBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // First, get the booking details to verify it exists and is in waiting status
        const [bookings] = await con.promise().query(
            `SELECT sb.*, s.service_name, s.price, sc.category_name, 
                    sb.customer_name, sb.customer_phone as phone_number,
                    e.name as barber_name
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             WHERE sb.id = ?`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        // Check if booking is in waiting status
        if (booking.approval_status !== 'waiting') {
            return res.status(400).json({
                success: false,
                message: `Booking cannot be approved. Current status: ${booking.approval_status}`
            });
        }

        // Update booking approval status to approved
        const [approveResult] = await con.promise().query(
            "UPDATE service_bookings SET approval_status = 'approved', updated_at = NOW() WHERE id = ?",
            [id]
        );

        if (approveResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }


        // Create queue entry for the approved booking
        // Reuse existing reference number or generate if somehow missing
        const reference_number = booking.reference_number || await generateReferenceNumber();

        // Calculate queue position (get the highest position and add 1)
        const [positionResult] = await con.promise().query(
            `SELECT IFNULL(MAX(queue_position), 0) as max_position FROM queues`
        );
        const queue_position = positionResult[0].max_position + 1;

        // Estimate wait time (simple calculation: position * average service duration)
        const estimated_wait_time = queue_position * 30; // Assuming 30 min average service

        // Insert queue entry
        const [queueResult] = await con.promise().query(
            `INSERT INTO queues 
             (booking_id, reference_number, queue_position, estimated_wait_time, queue_status, created_at)
             VALUES (?, ?, ?, ?, 'queued', NOW())`,
            [
                id,
                reference_number,
                queue_position,
                estimated_wait_time
            ]
        );

        // Update booking with reference number and set queue status
        await con.promise().query(
            `UPDATE service_bookings 
             SET reference_number = ?, queue_status = 'queued', updated_at = NOW()
             WHERE id = ?`,
            [reference_number, id]
        );

        // Update booking review
        const [updateReviewRes] = await con.promise().query(
            `UPDATE booking_reviews 
             SET reviewed_by = ?, 
                 review_status = 'approved', 
                 moved_to_queue = 1, 
                 queue_position = ?, 
                 confirmed_date = ?, 
                 confirmed_time = ?, 
                 reviewed_at = NOW(), 
                 updated_at = NOW() 
             WHERE booking_id = ?`,
            [
                req.user.user_id,
                queue_position,
                booking.appointment_date,
                booking.appointment_time,
                id
            ]
        );

        if (updateReviewRes.affectedRows === 0) {
            await con.promise().query(
                `INSERT INTO booking_reviews 
                 (booking_id, customer_id, service_id, barber_id, reviewed_by, review_status, moved_to_queue, queue_position, confirmed_date, confirmed_time, reviewed_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'approved', 1, ?, ?, ?, NOW(), NOW(), NOW())`,
                [
                    id,
                    booking.customer_id,
                    booking.service_id,
                    booking.barber_id || null,
                    req.user.user_id,
                    queue_position,
                    booking.appointment_date,
                    booking.appointment_time
                ]
            );
        }

        // Fetch the updated booking with queue info
        const [updatedBooking] = await con.promise().query(
            `SELECT sb.*, s.service_name, s.price, sc.category_name, 
                    sb.customer_name, sb.customer_phone as phone_number,
                    e.name as barber_name, q.reference_number, q.queue_position, 
                    q.estimated_wait_time, q.queue_status
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             LEFT JOIN queues q ON sb.id = q.booking_id
             WHERE sb.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Booking approved and added to queue",
            data: updatedBooking[0]
        });
    } catch (error) {
        console.error("Error approving booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to approve booking",
            error: error.message
        });
    }
};

// Reject a booking (admin/barber)
const rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        // First, get the booking details to verify it exists and is in waiting status
        const [bookings] = await con.promise().query(
            `SELECT sb.*, s.service_name, s.price, sc.category_name, 
                    sb.customer_name, sb.customer_phone as phone_number
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             JOIN service_categories sc ON s.category_id = sc.id
             WHERE sb.id = ?`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        // Check if booking is in waiting status
        if (booking.approval_status !== 'waiting') {
            return res.status(400).json({
                success: false,
                message: `Booking cannot be rejected. Current status: ${booking.approval_status}`
            });
        }

        // Update booking approval status to rejected
        const [result] = await con.promise().query(
            "UPDATE service_bookings SET approval_status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
            [rejection_reason || 'No reason provided', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Fetch the updated booking
        const [updatedBooking] = await con.promise().query(
            `SELECT sb.*, s.service_name, s.price, sc.category_name, 
                    sb.customer_name, sb.customer_phone as phone_number,
                    e.name as barber_name
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             WHERE sb.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Booking rejected",
            data: updatedBooking[0]
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject booking",
            error: error.message
        });
    }
};

// Confirm a booking (admin/barber)
const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await con.promise().query(
            "UPDATE service_bookings SET status = 'confirmed', updated_at = NOW() WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const [booking] = await con.promise().query("SELECT * FROM service_bookings WHERE id = ?", [id]);
        return res.json({ success: true, message: "Booking confirmed", data: booking[0] });
    } catch (error) {
        console.error("Error confirming booking:", error);
        return res.status(500).json({ success: false, message: "Failed to confirm booking" });
    }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await con.promise().query(
            "UPDATE service_bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        return res.json({ success: true, message: "Booking cancelled" });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel booking" });
    }
};

// Get customer bookings (authenticated customers only)
const getCustomerBookings = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const query = `
            SELECT
                sb.id,
                sb.service_id,
                s.service_name,
                sc.category_name,
                sb.barber_id,
                e.name as barber_name,
                sb.appointment_date AS booking_date,
                sb.appointment_time AS time_slot,
                sb.booking_status AS status,
                sb.customer_name,
                sb.customer_phone,
                sb.customer_email,
                sb.booking_note AS notes,
                s.price,
                s.discount_price,
                s.duration_minutes,
                sb.created_at,
                sb.reference_number,
                sb.approval_status,
                sb.queue_status
            FROM service_bookings sb
            LEFT JOIN services s ON sb.service_id = s.id
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN employees e ON sb.barber_id = e.employee_id
            WHERE sb.customer_id = ?
            ORDER BY sb.appointment_date DESC, sb.appointment_time ASC
        `;

        const [bookings] = await con.promise().query(query, [userId]);

        return res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching customer bookings:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch customer bookings', error: error.message });
    }
};


// Get all bookings (admin/barber)
const getBookings = async (req, res) => {
    try {
        const { date, barber_id, status } = req.query;
        let query = `
            SELECT sb.*, s.service_name, s.price, sc.category_name, e.name as barber_name
            FROM service_bookings sb
            LEFT JOIN services s ON sb.service_id = s.id
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN employees e ON sb.barber_id = e.employee_id
            WHERE 1=1
        `;
        const params = [];
        if (date) { query += " AND sb.appointment_date = ?"; params.push(date); }
        if (barber_id) { query += " AND sb.barber_id = ?"; params.push(barber_id); }
        if (status) { query += " AND sb.booking_status = ?"; params.push(status); }
        query += " ORDER BY sb.appointment_date DESC, sb.appointment_time ASC";
        const [bookings] = await con.promise().query(query, params);
        return res.json({ success: true, data: bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
    }
};

// ================================================
// SERVICE RATINGS
// ================================================


// GET all ratings for a public service
const getServiceRatings = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Verify service exists
        const [service] = await con.promise().query(
            "SELECT id FROM services WHERE id = ? AND status = 'active' AND is_available = 1",
            [id]
        );
        if (service.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        const [ratings] = await con.promise().query(
            `SELECT sr.id, sr.rating, sr.review_text, sr.created_at,
                    u.user_name, u.full_name
             FROM service_ratings sr
             LEFT JOIN users u ON sr.user_id = u.user_id
             WHERE sr.service_id = ?
             ORDER BY sr.created_at DESC
             LIMIT ? OFFSET ?`,
            [id, parseInt(limit), parseInt(offset)]
        );

        // Get total ratings count
        const [countRow] = await con.promise().query(
            "SELECT COUNT(*) as total FROM service_ratings WHERE service_id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            data: ratings,
            total: countRow[0].total
        });
    } catch (error) {
        console.error("Error fetching service ratings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service ratings",
            error: error.message
        });
    }
};

// GET public service with its ratings summary
const getServiceRatingsSummary = async (req, res) => {
    try {
        const { id } = req.params;

        const [service] = await con.promise().query(
            "SELECT id FROM services WHERE id = ? AND status = 'active' AND is_available = 1",
            [id]
        );
        if (service.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        // Aggregate ratings
        const [stats] = await con.promise().query(
            `SELECT 
                COUNT(*) as total_ratings,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
             FROM service_ratings
             WHERE service_id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                service_id: parseInt(id),
                total_ratings: stats[0].total_ratings || 0,
                avg_rating: stats[0].total_ratings > 0 ? Math.round((stats[0].avg_rating || 0) * 10) / 10 : 0,
                stars_5: stats[0].stars_5 || 0,
                stars_4: stats[0].stars_4 || 0,
                stars_3: stats[0].stars_3 || 0,
                stars_2: stats[0].stars_2 || 0,
                stars_1: stats[0].stars_1 || 0,
            }
        });
    } catch (error) {
        console.error("Error fetching ratings summary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ratings summary",
            error: error.message
        });
    }
};

// POST submit a rating (authenticated users / logged-in customers)
const getBookingByReference = async (req, res) => {
    try {
        const { reference_number } = req.params;

        const [rows] = await con.promise().query(
            `SELECT sb.*, s.service_name, sc.category_name,
                    e.name as barber_name,
                    q.reference_number as queue_reference_number,
                    q.queue_position, q.estimated_wait_time, q.queue_status
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             LEFT JOIN queues q ON sb.id = q.booking_id
             WHERE sb.reference_number = ?
             LIMIT 1`,
            [reference_number]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error getting booking by reference:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch booking", error: error.message });
    }
};

const approveBookingByReference = async (req, res) => {
    try {
        const { reference_number } = req.body;

        if (!reference_number) {
            return res.status(400).json({ success: false, message: "reference_number is required" });
        }

        const [rows] = await con.promise().query(
            `SELECT sb.*,
                    s.service_name, sc.category_name,
                    e.name as barber_name
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             WHERE sb.reference_number = ?
             LIMIT 1`,
            [reference_number]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const booking = rows[0];

        if (booking.approval_status !== 'waiting') {
            return res.status(400).json({
                success: false,
                message: `Booking cannot be approved. Current status: ${booking.approval_status}`
            });
        }

        await con.promise().query(
            "UPDATE service_bookings SET approval_status = 'approved', updated_at = NOW() WHERE id = ?",
            [booking.id]
        );

        const referenceNum = booking.reference_number || await generateReferenceNumber();

        const [positionResult] = await con.promise().query(
            `SELECT IFNULL(MAX(queue_position), 0) as max_position FROM queues`
        );
        const queue_position = positionResult[0].max_position + 1;
        const estimated_wait_time = queue_position * 30;

        await con.promise().query(
            `INSERT INTO queues
             (booking_id, reference_number, queue_position, estimated_wait_time, queue_status, created_at)
             VALUES (?, ?, ?, ?, 'queued', NOW())`,
            [booking.id, referenceNum, queue_position, estimated_wait_time]
        );

        await con.promise().query(
            `UPDATE service_bookings
             SET reference_number = ?, queue_status = 'queued', updated_at = NOW()
             WHERE id = ?`,
            [referenceNum, booking.id]
        );

        const [updatedBooking] = await con.promise().query(
            `SELECT sb.*, s.service_name, sc.category_name,
                    e.name as barber_name,
                    q.reference_number as queue_reference_number,
                    q.queue_position, q.estimated_wait_time, q.queue_status
             FROM service_bookings sb
             JOIN services s ON sb.service_id = s.id
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             LEFT JOIN employees e ON sb.barber_id = e.employee_id
             LEFT JOIN queues q ON sb.id = q.booking_id
             WHERE sb.id = ?`,
            [booking.id]
        );

        return res.status(200).json({
            success: true,
            message: "Booking approved and added to queue",
            data: updatedBooking[0]
        });
    } catch (error) {
        console.error("Error approving booking by reference:", error);
        return res.status(500).json({ success: false, message: "Failed to approve booking", error: error.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const [bookingRows] = await con.promise().query(
            "SELECT id FROM service_bookings WHERE id = ?",
            [id]
        );

        if (bookingRows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Delete queue row(s) first (if any)
        await con.promise().query(
            "DELETE FROM queues WHERE booking_id = ?",
            [id]
        );

        await con.promise().query(
            "DELETE FROM service_bookings WHERE id = ?",
            [id]
        );

        return res.status(200).json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({ success: false, message: "Failed to delete booking", error: error.message });
    }
};

const submitServiceRating = async (req, res) => {

    // Ensure table exists (prevents runtime failure if migrations weren't applied)
    // This is safe because we use CREATE TABLE IF NOT EXISTS.
    try {
        await con.promise().query(`
            CREATE TABLE IF NOT EXISTS service_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service_id INT NOT NULL,
                user_id INT NOT NULL,
                rating TINYINT NOT NULL,
                review_text TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_service_user (service_id, user_id),
                INDEX idx_service_ratings_service (service_id),
                INDEX idx_service_ratings_user (user_id)
            ) ENGINE=InnoDB;
            `);
    } catch (tableErr) {
        // If the table cannot be created due to FK issues or schema differences,
        // we'll let the original error surface below.
        console.warn('[service_ratings] ensure table failed:', tableErr.message);
    }

    try {
        const { id } = req.params; // service_id
        const { rating, review_text } = req.body;
        const user_id = req.user.user_id;

        // Validation
        const parsedRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
        if (parsedRating === undefined || parsedRating === null || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }


        // Verify service exists
        const [service] = await con.promise().query(
            "SELECT id FROM services WHERE id = ? AND status = 'active' AND is_available = 1",
            [id]
        );
        if (service.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        // Upsert rating (create or update existing)
        const [existing] = await con.promise().query(
            "SELECT id FROM service_ratings WHERE service_id = ? AND user_id = ?",
            [id, user_id]
        );

        if (existing.length > 0) {
            // Update existing
            await con.promise().query(
                `UPDATE service_ratings 
                 SET rating = ?, review_text = ?, updated_at = NOW()
                 WHERE id = ?`,
                [rating, review_text || null, existing[0].id]
            );
            return res.status(200).json({
                success: true,
                message: "Rating updated successfully"
            });
        } else {
            // Insert new
            await con.promise().query(
                `INSERT INTO service_ratings (service_id, user_id, rating, review_text, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [id, user_id, rating, review_text || null]
            );
            return res.status(201).json({
                success: true,
                message: "Rating submitted successfully"
            });
        }

        // NOTE:
        // Do not hard-depend on services.rating_avg existing.
        // The public UI fetches avg/total from /services/public/:id/ratings/summary,
        // which aggregates from service_ratings.

    } catch (error) {
        console.error("Error submitting service rating:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit rating",
            error: error.message
        });
    }
};

// GET the current user's rating for a service
const getMyServiceRating = async (req, res) => {
    try {
        const { id: serviceId } = req.params;
        const user_id = req.user.user_id;

        const [rows] = await con.promise().query(
            "SELECT id, rating, review_text, created_at FROM service_ratings WHERE service_id = ? AND user_id = ?",
            [serviceId, user_id]
        );

        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: null });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching my service rating:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your rating",
            error: error.message
        });
    }
};

// ================================================
// SERVICE PACKAGES CONTROLLER
// ================================================

const ensureServicePackagesTable = async () => {
    try {
        await con.promise().query(`
            CREATE TABLE IF NOT EXISTS service_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                package_name VARCHAR(255) NOT NULL,
                package_slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NULL,
                price DECIMAL(10,2) NOT NULL,
                discount_price DECIMAL(10,2) NULL,
                duration_minutes INT NOT NULL DEFAULT 60,
                package_image VARCHAR(500) NULL,
                included_services TEXT NULL,
                is_featured TINYINT(1) DEFAULT 0,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
    } catch (err) {
        console.warn('[ensureServicePackagesTable] failed:', err.message);
    }
};

const getServicePackages = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const { status, search } = req.query;
        let query = "SELECT * FROM service_packages";
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push("status = ?");
            params.push(status);
        }
        if (search) {
            conditions.push("(package_name LIKE ? OR description LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY is_featured DESC, created_at DESC";
        const [packages] = await con.promise().query(query, params);

        return res.status(200).json({
            success: true,
            data: packages,
            count: packages.length
        });
    } catch (error) {
        console.error("Error fetching service packages:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service packages",
            error: error.message
        });
    }
};

const getServicePackagesPublic = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const { search } = req.query;
        let query = "SELECT * FROM service_packages WHERE status = 'active'";
        const params = [];

        if (search) {
            query += " AND (package_name LIKE ? OR description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY is_featured DESC, created_at DESC";
        const [packages] = await con.promise().query(query, params);

        return res.status(200).json({
            success: true,
            data: packages,
            count: packages.length
        });
    } catch (error) {
        console.error("Error fetching public service packages:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service packages",
            error: error.message
        });
    }
};

const getServicePackageById = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const { id } = req.params;
        const [packages] = await con.promise().query("SELECT * FROM service_packages WHERE id = ?", [id]);

        if (packages.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service package not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: packages[0]
        });
    } catch (error) {
        console.error("Error fetching service package:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service package",
            error: error.message
        });
    }
};

const createServicePackage = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const {
            package_name,
            description,
            price,
            discount_price,
            duration_minutes,
            included_services,
            is_featured,
            status
        } = req.body;

        if (!package_name || package_name.trim() === "") {
            return res.status(400).json({ success: false, message: "Package name is required" });
        }
        if (!price || isNaN(parseFloat(price))) {
            return res.status(400).json({ success: false, message: "Valid price is required" });
        }

        const slug = package_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/services/${req.file.filename}`;
        }

        const featured = is_featured === '1' || is_featured === 1 || is_featured === true;

        const [result] = await con.promise().query(
            `INSERT INTO service_packages 
             (package_name, package_slug, description, price, discount_price, duration_minutes, package_image, included_services, is_featured, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                package_name.trim(),
                slug,
                description || null,
                parseFloat(price),
                discount_price ? parseFloat(discount_price) : null,
                duration_minutes ? parseInt(duration_minutes) : 60,
                imagePath,
                included_services || null,
                featured ? 1 : 0,
                status || 'active'
            ]
        );

        const [newPkg] = await con.promise().query("SELECT * FROM service_packages WHERE id = ?", [result.insertId]);

        return res.status(201).json({
            success: true,
            message: "Service package created successfully",
            data: newPkg[0]
        });
    } catch (error) {
        console.error("Error creating service package:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create service package",
            error: error.message
        });
    }
};

const updateServicePackage = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const { id } = req.params;
        const {
            package_name,
            description,
            price,
            discount_price,
            duration_minutes,
            included_services,
            is_featured,
            status
        } = req.body;

        const [existing] = await con.promise().query("SELECT * FROM service_packages WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Service package not found" });
        }

        let imagePath = existing[0].package_image;
        if (req.file) {
            imagePath = `/uploads/services/${req.file.filename}`;
        }

        const featured = is_featured !== undefined ? (is_featured === '1' || is_featured === 1 || is_featured === true) : existing[0].is_featured;

        await con.promise().query(
            `UPDATE service_packages 
             SET package_name = ?, description = ?, price = ?, discount_price = ?, duration_minutes = ?, package_image = ?, included_services = ?, is_featured = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                package_name || existing[0].package_name,
                description !== undefined ? description : existing[0].description,
                price !== undefined ? parseFloat(price) : existing[0].price,
                discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : existing[0].discount_price,
                duration_minutes !== undefined ? parseInt(duration_minutes) : existing[0].duration_minutes,
                imagePath,
                included_services !== undefined ? included_services : existing[0].included_services,
                featured ? 1 : 0,
                status || existing[0].status,
                id
            ]
        );

        const [updated] = await con.promise().query("SELECT * FROM service_packages WHERE id = ?", [id]);

        return res.status(200).json({
            success: true,
            message: "Service package updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating service package:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update service package",
            error: error.message
        });
    }
};

const deleteServicePackage = async (req, res) => {
    try {
        await ensureServicePackagesTable();
        const { id } = req.params;
        const [result] = await con.promise().query("DELETE FROM service_packages WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Service package not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Service package deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting service package:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete service package",
            error: error.message
        });
    }
};

module.exports = {
    // Service Categories
    getServiceCategories,
    getServiceCategoryById,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,

    // Services
    getServices,
    getServicesPublic,
    getServiceById,
    createService,
    updateService,
    deleteService,
    toggleServiceAvailability,

    // Service Packages
    getServicePackages,
    getServicePackagesPublic,
    getServicePackageById,
    createServicePackage,
    updateServicePackage,
    deleteServicePackage,

    // Public
    getServiceByIdForPublic,
    getCategoriesForPublic,

    // Bookings
    getBarbers,
    getAvailableSlots,
    createBooking,
    getBookings,
    getCustomerBookings,
    approveBooking,
    rejectBooking,
    confirmBooking,
    cancelBooking,

    // Booking by reference
    getBookingByReference,
    approveBookingByReference,
    deleteBooking,

    // Ratings
    getServiceRatings,
    getServiceRatingsSummary,
    submitServiceRating,
    getMyServiceRating
};

