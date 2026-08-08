const AuditLog = require('../models/AuditLog');

/**
 * Log user action to AuditLog collection
 */
const logAuditAction = async ({ req, user, action, module: moduleName, recordId, description }) => {
    try {
        const currentUser = user || (req ? req.user : null);
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';

        AuditLog.create({
            user: currentUser ? currentUser._id : null,
            userName: currentUser ? currentUser.fullName : 'System / Guest',
            userRole: currentUser ? currentUser.role : 'System',
            action: action || 'GENERAL_ACTION',
            module: moduleName || 'General',
            recordId: recordId || '',
            description: description || 'Action performed',
            ipAddress: ip,
            timestamp: new Date(),
        }).catch((error) => console.error('[Audit Logger Error]:', error.message));
    } catch (error) {
        console.error('[Audit Logger Error]:', error.message);
    }
};

module.exports = { logAuditAction };
