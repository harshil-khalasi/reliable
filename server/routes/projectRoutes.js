const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, authorize('Admin'), createProject);
router.put('/:id', protect, updateProject); // Admin can update all; User can update status
router.delete('/:id', protect, authorize('Admin'), deleteProject);

module.exports = router;
