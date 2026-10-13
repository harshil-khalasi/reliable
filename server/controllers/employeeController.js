const Employee = require('../models/Employee');
const Project = require('../models/Project');
const User = require('../models/User');

const getEmployees = async (req, res, next) => {
  try {
    const {
      search,
      department,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { designation: searchRegex },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      employees,
    });
  } catch (error) {
    next(error);
  }
};

const getAllEmployeesList = async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ name: 1 }).select('_id name email designation department status');
    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const assignedProjects = await Project.find({
      assignedEmployees: employee._id,
    }).select('name status priority deadline startDate');

    res.status(200).json({
      success: true,
      employee,
      assignedProjects,
    });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, designation, department, joiningDate, status, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Employee Name must be at least 2 characters long.',
      });
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid email address.',
      });
    }

    if (!phone || !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid 10-digit phone number.',
      });
    }

    if (!designation || designation.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Designation must be at least 2 characters long.',
      });
    }

    if (!joiningDate || isNaN(new Date(joiningDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid joining date.',
      });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Password is required and must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: An employee with this email already exists.',
      });
    }

    // Create the Employee record
    const employee = await Employee.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      designation: designation.trim(),
      department,
      joiningDate,
      status: status || 'Active',
    });

    // Create corresponding login account for this employee
    const initialPassword = password.trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: initialPassword,
        role: 'Employee',
        employee: employee._id,
      });
    } else {
      user.role = 'Employee';
      user.employee = employee._id;
      if (password && password.trim().length >= 6) {
        user.password = password.trim();
      }
      await user.save();
    }

    employee.userId = user._id;
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created and login account provisioned successfully',
      employee,
      loginEmail: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, designation, department, joiningDate, status, password } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const oldEmail = employee.email;

    if (email && email.toLowerCase() !== employee.email) {
      const emailExists = await Employee.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists',
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Employee Name must be at least 2 characters long.' });
      }
      employee.name = name.trim();
    }

    if (phone) {
      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number.' });
      }
      employee.phone = phone.trim();
    }

    if (designation) {
      if (designation.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Designation must be at least 2 characters long.' });
      }
      employee.designation = designation.trim();
    }

    if (department) employee.department = department;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;

    const updatedEmployee = await employee.save();

    // Update corresponding user record if exists
    let user = await User.findOne({ $or: [{ employee: employee._id }, { email: oldEmail }] });
    if (user) {
      if (name) user.name = name.trim();
      if (email) user.email = email.toLowerCase().trim();
      if (password && password.trim().length >= 6) {
        user.password = password.trim();
      }
      user.employee = employee._id;
      user.role = 'Employee';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Remove employee reference from projects
    await Project.updateMany(
      { assignedEmployees: employee._id },
      { $pull: { assignedEmployees: employee._id } }
    );

    // Delete corresponding user account
    await User.deleteMany({
      $or: [{ employee: employee._id }, { email: employee.email }],
    });

    await employee.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Employee and login credentials deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getAllEmployeesList,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
