const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs (Admin only)
// @route   GET /api/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { module: moduleName, action, page = 1, limit = 50 } = req.query;
        const query = {};

        if (moduleName) query.module = moduleName;
        if (action) query.action = action;

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            logs,
        });
    } catch (error) {
        next(error);
    }
};
