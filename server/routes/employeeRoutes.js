const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getAllEmployeesList,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public to all authenticated users
router.get('/', protect, getEmployees);
router.get('/all/list', protect, getAllEmployeesList);
router.get('/:id', protect, getEmployeeById);

// Admin-only operations
router.post('/', protect, authorize('Admin'), createEmployee);
router.put('/:id', protect, authorize('Admin'), updateEmployee);
router.delete('/:id', protect, authorize('Admin'), deleteEmployee);

module.exports = router;
