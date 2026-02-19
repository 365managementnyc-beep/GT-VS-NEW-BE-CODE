const mongoose = require('mongoose');
const { permissions } = require('../utils/permissions');

const singleTaskSchema = new mongoose.Schema({
    taskName: { type: String },
    description: { type: String }
});

const taskSchema = new mongoose.Schema({
    templateName: { type: String, required: true, unique: true },
    tasks: [singleTaskSchema],
    assignedby: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false } // Soft delete

});

const permissionSchema = new mongoose.Schema({
    templateName: { type: String, required: true, unique: true },
    tabPermissions: [{ type: String, enum: permissions.subAdmin }],
    isDeleted: { type: Boolean, default: false } 
});

const Permission = mongoose.model('Permission', permissionSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = { Permission, Task };
