const User = require('../models/User');
const { logAuditAction } = require('../utils/auditLogger');

// Helper to generate unique User ID (USR-001)
const generateUserId = async () => {
    const count = await User.countDocuments();
    const nextNum = (count + 1).toString().padStart(3, '0');
    return `USR-${nextNum}`;
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
    try {
        const { fullName, username, email, phone, role, password } = req.body;

        if (!fullName || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide full name, username, email, and initial password',
            });
        }

        const existingUser = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists',
            });
        }

        const userId = await generateUserId();

        const user = await User.create({
            userId,
            fullName,
            username,
            email,
            phone,
            role: role || 'midwife_nurse',
            password,
            mustChangePassword: true,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'USER_CREATE',
            module: 'Users',
            recordId: user.userId,
            description: `Admin created user '${user.username}' with role '${user.role}'.`,
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                userId: user.userId,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user details / role (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { fullName, email, phone, role, status } = req.body;
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'USER_UPDATE',
            module: 'Users',
            recordId: user.userId,
            description: `Admin updated user details for '${user.username}'.`,
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                userId: user.userId,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deactivate / Activate user (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'Admin cannot deactivate their own active account' });
        }

        user.status = status || (user.status === 'active' ? 'inactive' : 'active');
        await user.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'USER_STATUS_CHANGE',
            module: 'Users',
            recordId: user.userId,
            description: `Admin changed status of user '${user.username}' to '${user.status}'.`,
        });

        res.status(200).json({
            success: true,
            message: `User status set to ${user.status}`,
            status: user.status,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset user password (Admin only)
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        user.mustChangePassword = true;
        await user.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'PASSWORD_RESET',
            module: 'Users',
            recordId: user.userId,
            description: `Admin reset password for user '${user.username}'.`,
        });

        res.status(200).json({
            success: true,
            message: `Password reset successfully for ${user.username}`,
        });
    } catch (error) {
        next(error);
    }
};
