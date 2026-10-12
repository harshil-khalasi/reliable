const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      minlength: [3, 'Project Name must be at least 3 characters long'],
      maxlength: [120, 'Project Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project Description is required'],
      trim: true,
      minlength: [10, 'Project Description must be at least 10 characters long'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start Date is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      validate: {
        validator: function (value) {
          if (!this.startDate || !value) return true;
          return new Date(value) >= new Date(this.startDate);
        },
        message: 'Deadline cannot be before the start date',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress, or Completed',
      },
      default: 'Pending',
    },
    assignedEmployees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1;
        },
        message: 'At least one employee must be assigned to the project',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook for dates
projectSchema.pre('validate', function () {
  if (this.startDate && this.deadline && new Date(this.deadline) < new Date(this.startDate)) {
    this.invalidate('deadline', 'Deadline cannot be before the start date');
  }
  if (!this.assignedEmployees || this.assignedEmployees.length === 0) {
    this.invalidate('assignedEmployees', 'At least one employee must be assigned to the project');
  }
});

projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ name: 'text' });

module.exports = mongoose.model('Project', projectSchema);
