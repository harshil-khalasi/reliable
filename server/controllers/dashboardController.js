const Employee = require('../models/Employee');
const Project = require('../models/Project');

const getDashboardStats = async (req, res, next) => {
  try {
    const isEmployee = req.user && req.user.role === 'Employee';

    let employeeProfile = null;
    let employeeProjectQuery = {};

    if (isEmployee) {
      employeeProfile = await Employee.findOne({
        $or: [
          { userId: req.user._id },
          { email: req.user.email.toLowerCase() },
          { _id: req.user.employee },
        ],
      });

      if (employeeProfile) {
        employeeProjectQuery = { assignedEmployees: employeeProfile._id };
      }
    }

    // Total counts
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'Inactive' });

    // Project counts (filtered if Employee, global if Admin)
    const projectFilter = isEmployee ? employeeProjectQuery : {};

    const totalProjects = await Project.countDocuments(projectFilter);
    const projectsInProgress = await Project.countDocuments({ ...projectFilter, status: 'In Progress' });
    const completedProjects = await Project.countDocuments({ ...projectFilter, status: 'Completed' });
    const pendingProjects = await Project.countDocuments({ ...projectFilter, status: 'Pending' });

    const highPriorityProjects = await Project.countDocuments({ ...projectFilter, priority: 'High' });
    const mediumPriorityProjects = await Project.countDocuments({ ...projectFilter, priority: 'Medium' });
    const lowPriorityProjects = await Project.countDocuments({ ...projectFilter, priority: 'Low' });

    const departmentBreakdown = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const recentProjects = await Project.find(projectFilter)
      .populate('assignedEmployees', 'name email designation department')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      role: req.user ? req.user.role : 'Admin',
      employeeName: employeeProfile ? employeeProfile.name : null,
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        totalProjects,
        projectsInProgress,
        completedProjects,
        pendingProjects,
        highPriorityProjects,
        mediumPriorityProjects,
        lowPriorityProjects,
        departmentBreakdown: departmentBreakdown.map((d) => ({
          department: d._id,
          count: d.count,
        })),
        recentProjects,
        recentEmployees,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
