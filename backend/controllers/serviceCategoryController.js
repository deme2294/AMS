const db = require('../models/db');
const path = require('path');
const fs = require('fs');

/**
 * Get all service categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let query = 'SELECT * FROM service_categories WHERE 1=1';
        const params = [];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (search) {
            query += ' AND (category_name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY COALESCE(sort_order, display_order, 0) ASC, id DESC';
        
        const [categories] = await db.promise().query(query, params);

        const normalized = categories.map(cat => ({
            ...cat,
            image: cat.image || cat.category_image || cat.image_url,
            category_image: cat.category_image || cat.image || cat.image_url,
            banner_image: cat.banner_image || cat.category_image || cat.image || cat.image_url,
            sort_order: cat.sort_order ?? cat.display_order ?? 0,
            display_order: cat.display_order ?? cat.sort_order ?? 0,
            color: cat.color || '#ec4899',
            icon: cat.icon || cat.category_icon || 'fa-solid fa-spa',
        }));
        
        res.json({
            success: true,
            data: normalized
        });
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch categories',
            error: error.message 
        });
    }
};

/**
 * Get single category by ID
 */
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [categories] = await db.promise().query(
            'SELECT * FROM service_categories WHERE id = ?',
            [id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const cat = categories[0];
        const normalized = {
            ...cat,
            image: cat.image || cat.category_image || cat.image_url,
            category_image: cat.category_image || cat.image || cat.image_url,
            banner_image: cat.banner_image || cat.category_image || cat.image || cat.image_url,
            sort_order: cat.sort_order ?? cat.display_order ?? 0,
            display_order: cat.display_order ?? cat.sort_order ?? 0,
            color: cat.color || '#ec4899',
            icon: cat.icon || cat.category_icon || 'fa-solid fa-spa',
        };
        
        res.json({
            success: true,
            data: normalized
        });
    } catch (error) {
        console.error('Error fetching category:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch category',
            error: error.message 
        });
    }
};

/**
 * Create new service category
 */
exports.createCategory = async (req, res) => {
    try {
        const { 
            category_name, 
            description, 
            icon, 
            color, 
            sort_order, 
            status,
            banner_image,
            image
        } = req.body;
        
        // Validate required fields
        if (!category_name || !category_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        
        // Check if category already exists
        const [existing] = await db.promise().query(
            'SELECT id FROM service_categories WHERE category_name = ?',
            [category_name.trim()]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }
        
        // Get image path if uploaded or provided
        let image_url = image || req.body.image_url || null;
        if (req.file) {
            image_url = `/uploads/categories/${req.file.filename}`;
        }
        const bannerVal = banner_image || image_url;

        const sortVal = parseInt(sort_order, 10) || 0;
        const colorVal = color || '#ec4899';
        const iconVal = icon || 'fa-solid fa-spa';
        const statusVal = status || 'active';
        const createdBy = req.user?.user_id || req.user?.id || 1;
        
        const [result] = await db.promise().query(
            `INSERT INTO service_categories 
            (category_name, description, image, image_url, category_image, banner_image, icon, category_icon, color, sort_order, display_order, status, created_by, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                category_name.trim(),
                description || null,
                image_url,
                image_url,
                image_url,
                bannerVal,
                iconVal,
                iconVal,
                colorVal,
                sortVal,
                sortVal,
                statusVal,
                createdBy
            ]
        );
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: result.insertId,
                category_name: category_name.trim(),
                description,
                image: image_url,
                category_image: image_url,
                banner_image: bannerVal,
                icon: iconVal,
                color: colorVal,
                sort_order: sortVal,
                display_order: sortVal,
                status: statusVal
            }
        });
    } catch (error) {
        console.error('Error creating category:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create category',
            error: error.message 
        });
    }
};

/**
 * Update service category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            category_name, 
            description, 
            icon, 
            color, 
            sort_order, 
            status,
            banner_image,
            image
        } = req.body;
        
        // Check if category exists
        const [existing] = await db.promise().query(
            'SELECT * FROM service_categories WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Get image path if uploaded or passed
        let image_url = image || req.body.image_url || existing[0].image || existing[0].category_image || existing[0].image_url;
        if (req.file) {
            // Delete old image if exists
            if (existing[0].image && existing[0].image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', existing[0].image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            image_url = `/uploads/categories/${req.file.filename}`;
        }

        const bannerVal = banner_image !== undefined ? banner_image : (existing[0].banner_image || image_url);
        const sortVal = sort_order !== undefined ? parseInt(sort_order, 10) || 0 : (existing[0].sort_order ?? existing[0].display_order ?? 0);
        const iconVal = icon !== undefined ? icon : (existing[0].icon || existing[0].category_icon || 'fa-solid fa-spa');
        const colorVal = color || existing[0].color || '#ec4899';
        const statusVal = status || existing[0].status || 'active';
        const nameVal = category_name ? category_name.trim() : existing[0].category_name;
        const descVal = description !== undefined ? description : existing[0].description;
        
        await db.promise().query(
            `UPDATE service_categories 
            SET category_name = ?, description = ?, image = ?, image_url = ?, category_image = ?, banner_image = ?,
                icon = ?, category_icon = ?, color = ?, sort_order = ?, display_order = ?,
                status = ?, updated_at = NOW()
            WHERE id = ?`,
            [
                nameVal,
                descVal,
                image_url,
                image_url,
                image_url,
                bannerVal,
                iconVal,
                iconVal,
                colorVal,
                sortVal,
                sortVal,
                statusVal,
                id
            ]
        );
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: {
                id: parseInt(id, 10),
                category_name: nameVal,
                description: descVal,
                image: image_url,
                category_image: image_url,
                banner_image: bannerVal,
                icon: iconVal,
                color: colorVal,
                sort_order: sortVal,
                display_order: sortVal,
                status: statusVal
            }
        });
    } catch (error) {
        console.error('Error updating category:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update category',
            error: error.message 
        });
    }
};

/**
 * Delete service category
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if category exists
        const [existing] = await db.promise().query(
            'SELECT * FROM service_categories WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Check if category has services
        const [services] = await db.promise().query(
            'SELECT COUNT(*) as count FROM services WHERE category_id = ?',
            [id]
        );
        
        if (services[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${services[0].count} service(s) associated with it.`
            });
        }
        
        // Delete image if exists
        if (existing[0].image) {
            const imagePath = path.join(__dirname, '..', existing[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await db.promise().query('DELETE FROM service_categories WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete category',
            error: error.message 
        });
    }
};

/**
 * Toggle category status
 */
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await db.promise().query(
            'SELECT status FROM service_categories WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        const newStatus = existing[0].status === 'active' ? 'inactive' : 'active';
        
        await db.promise().query(
            'UPDATE service_categories SET status = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, id]
        );
        
        res.json({
            success: true,
            message: `Category ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: { status: newStatus }
        });
    } catch (error) {
        console.error('Error toggling category status:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to toggle category status',
            error: error.message 
        });
    }
};

/**
 * Update category sort order
 */
exports.updateSortOrder = async (req, res) => {
    try {
        const { categories } = req.body; // Array of {id, sort_order}
        
        if (!Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format'
            });
        }
        
        // Update sort order for each category
        for (const cat of categories) {
            await db.promise().query(
                'UPDATE service_categories SET sort_order = ?, display_order = ?, updated_at = NOW() WHERE id = ?',
                [cat.sort_order, cat.sort_order, cat.id]
            );
        }
        
        res.json({
            success: true,
            message: 'Sort order updated successfully'
        });
    } catch (error) {
        console.error('Error updating sort order:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update sort order',
            error: error.message 
        });
    }
};
