const Project = require('../models/Project');
const Employee = require('../models/Employee');

const getProjects = async (req, res, next) => {
  try {
    const { status, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search && search.trim() !== '') {
      query.name = new RegExp(search.trim(), 'i');
    }

    // Role-based visibility:
    // If the logged-in user is an Employee, only return projects assigned to them!
    if (req.user && req.user.role === 'Employee') {
      const employee = await Employee.findOne({
        $or: [
          { userId: req.user._id },
          { email: req.user.email.toLowerCase() },
          { _id: req.user.employee },
        ],
      });

      if (!employee) {
        return res.status(200).json({
          success: true,
          count: 0,
          projects: [],
          message: 'No assigned employee profile found for this user account.',
        });
      }

      query.assignedEmployees = employee._id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const projects = await Project.find(query)
      .populate('assignedEmployees', 'name email designation department status')
      .populate('createdBy', 'name email role')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedEmployees', 'name email designation department status')
      .populate('createdBy', 'name email role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // If Employee, ensure project is assigned to them
    if (req.user && req.user.role === 'Employee') {
      const employee = await Employee.findOne({
        $or: [
          { userId: req.user._id },
          { email: req.user.email.toLowerCase() },
          { _id: req.user.employee },
        ],
      });

      const isAssigned =
        employee &&
        project.assignedEmployees.some(
          (emp) => emp._id.toString() === employee._id.toString()
        );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to view this project.',
        });
      }
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startDate,
      deadline,
      priority,
      status,
      assignedEmployees,
    } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Project Name must be at least 3 characters long.',
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Project Description must be at least 10 characters long.',
      });
    }

    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid Start Date.',
      });
    }

    if (!deadline || isNaN(new Date(deadline).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid Deadline.',
      });
    }

    // Validate that deadline is not before startDate
    if (new Date(deadline) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Deadline cannot be before the start date.',
      });
    }

    // Validate at least one employee is assigned (Requirement: "one or more")
    if (!assignedEmployees || !Array.isArray(assignedEmployees) || assignedEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please assign at least one employee to this project.',
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      startDate,
      deadline,
      priority: priority || 'Medium',
      status: status || 'Pending',
      assignedEmployees,
      createdBy: req.user ? req.user._id : null,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('assignedEmployees', 'name email designation department status')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const {
      name,
      description,
      startDate,
      deadline,
      priority,
      status,
      assignedEmployees,
    } = req.body;

    // Check Employee permissions
    if (req.user.role === 'Employee') {
      const employee = await Employee.findOne({
        $or: [
          { userId: req.user._id },
          { email: req.user.email.toLowerCase() },
          { _id: req.user.employee },
        ],
      });

      if (!employee) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: No employee profile found for your account.',
        });
      }

      const isAssigned = project.assignedEmployees.some(
        (empId) => empId.toString() === employee._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You can only edit projects assigned to you.',
        });
      }

      // Employees can update status and description/notes
      if (status) project.status = status;
      if (description && description.trim().length >= 10) {
        project.description = description.trim();
      }
    } else {
      // Admin has full edit rights across all fields
      const newStartDate = startDate ? new Date(startDate) : new Date(project.startDate);
      const newDeadline = deadline ? new Date(deadline) : new Date(project.deadline);

      if (newDeadline < newStartDate) {
        return res.status(400).json({
          success: false,
          message: 'Validation error: Deadline cannot be before the start date.',
        });
      }

      if (name) {
        if (name.trim().length < 3) {
          return res.status(400).json({ success: false, message: 'Project Name must be at least 3 characters long.' });
        }
        project.name = name.trim();
      }
      if (description) {
        if (description.trim().length < 10) {
          return res.status(400).json({ success: false, message: 'Project Description must be at least 10 characters long.' });
        }
        project.description = description.trim();
      }
      if (startDate) project.startDate = startDate;
      if (deadline) project.deadline = deadline;
      if (priority) project.priority = priority;
      if (status) project.status = status;
      if (assignedEmployees !== undefined) {
        if (!Array.isArray(assignedEmployees) || assignedEmployees.length === 0) {
          return res.status(400).json({ success: false, message: 'At least one employee must be assigned to the project.' });
        }
        project.assignedEmployees = assignedEmployees;
      }
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('assignedEmployees', 'name email designation department status')
      .populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
