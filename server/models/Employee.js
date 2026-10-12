const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Employee Name is required'],
      trim: true,
      minlength: [2, 'Employee Name must be at least 2 characters long'],
      maxlength: [80, 'Employee Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address (e.g. name@company.com)',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [
        /^[0-9]{10}$/,
        'Please provide a valid 10-digit phone number',
      ],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      minlength: [2, 'Designation must be at least 2 characters long'],
      maxlength: [100, 'Designation cannot exceed 100 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      enum: {
        values: [
          'Engineering',
          'Design',
          'Marketing',
          'Sales',
          'Human Resources',
          'Finance',
          'Operations',
          'Product',
        ],
        message: '{VALUE} is not a supported department',
      },
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining Date is required'],
      validate: {
        validator: function (val) {
          return val instanceof Date && !isNaN(val.getTime());
        },
        message: 'Please provide a valid joining date',
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Active', 'Inactive'],
        message: 'Status must be either Active or Inactive',
      },
      default: 'Active',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for fast searching and filtering
employeeSchema.index({ name: 'text', email: 'text' });
employeeSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
