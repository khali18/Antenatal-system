const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAuditAction } = require('../utils/auditLogger');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '24h',
    });
};

// @desc    Login user & return JWT token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username/email and password',
            });
        }

        // Check for user by username or email
        const user = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.',
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate token
        const token = generateToken(user._id);

        // Audit log
        await logAuditAction({
            user,
            req,
            action: 'LOGIN',
            module: 'Auth',
            recordId: user.userId,
            description: `User '${user.username}' (${user.role}) logged in successfully.`,
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                userId: user.userId,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                userId: user.userId,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
                lastLogin: user.lastLogin,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();

        await logAuditAction({
            user,
            req,
            action: 'PASSWORD_CHANGE',
            module: 'Auth',
            recordId: user.userId,
            description: `User '${user.username}' changed their password.`,
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};
