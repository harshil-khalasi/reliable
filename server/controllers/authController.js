const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'a8F3kL9pQ2xR7vN5mT4zW6bY1cD0eG8h',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'Employee',
      phone,
      designation,
      department,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user or employee with this email already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Employee';

    if (assignedRole === 'Employee' && phone && !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid 10-digit phone number.',
      });
    }

    // Create user account
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
    });

    // If registering as Employee, also create Employee profile
    let employee = null;
    if (assignedRole === 'Employee') {
      const existingEmp = await Employee.findOne({ email: normalizedEmail });
      if (existingEmp) {
        existingEmp.userId = user._id;
        await existingEmp.save();
        employee = existingEmp;
      } else {
        employee = await Employee.create({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : '9800000000',
          designation: designation ? designation.trim() : 'Software Engineer',
          department: department || 'Engineering',
          joiningDate: new Date(),
          status: 'Active',
          userId: user._id,
        });
      }
      user.employee = employee._id;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: employee ? employee._id : null,
        designation: employee ? employee.designation : (user.role === 'Admin' ? 'Administrator' : 'Employee'),
        department: employee ? employee.department : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).populate('employee');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Find linked employee if not already attached
    let empRecord = user.employee;
    if (!empRecord && user.role === 'Employee') {
      empRecord = await Employee.findOne({
        $or: [{ email: normalizedEmail }, { userId: user._id }],
      });
      if (empRecord) {
        user.employee = empRecord._id;
        empRecord.userId = user._id;
        await Promise.all([user.save(), empRecord.save()]);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: empRecord ? empRecord._id : null,
        designation: empRecord ? empRecord.designation : (user.role === 'Admin' ? 'Administrator' : 'Employee'),
        department: empRecord ? empRecord.department : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('employee');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let empRecord = user.employee;
    if (!empRecord && user.role === 'Employee') {
      empRecord = await Employee.findOne({
        $or: [{ email: user.email.toLowerCase() }, { userId: user._id }],
      });
      if (empRecord) {
        user.employee = empRecord._id;
        empRecord.userId = user._id;
        await Promise.all([user.save(), empRecord.save()]);
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: empRecord ? empRecord._id : null,
        designation: empRecord ? empRecord.designation : (user.role === 'Admin' ? 'Administrator' : 'Employee'),
        department: empRecord ? empRecord.department : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
