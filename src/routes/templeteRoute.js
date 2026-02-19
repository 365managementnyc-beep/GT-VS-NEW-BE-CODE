const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const {
    getTempletes,
    getTempleteById,
    createTempletePermission,
    updateTemplete,
    deleteTemplete,
    getTempleteNames,

    deleteTask,
    createTempleteTask,
    editTaskTemplete,
    getTaskTempletes,
    getTaskTempleteById,
    getTaskTemplateNames
} = require('../controllers/templeteController');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

/// ///////////////////////////////////////templete tasks///////////////////////////////////////
const router = express.Router();
router.route("/task").post(requireAuth, restrictTo(["admin"]), logActionMiddleware("Create Task template", "Task"), createTempleteTask).get(requireAuth, restrictTo(["admin"]), getTaskTempletes);
router.route("/task/templeteNames").get(requireAuth, restrictTo(["admin"]), getTaskTemplateNames);
router.route("/task/:id").get(requireAuth, restrictTo(["admin"]), getTaskTempleteById).patch(requireAuth, restrictTo(["admin"]), logActionMiddleware("Update Task template", "Task"), editTaskTemplete).delete(requireAuth, restrictTo(["admin"]), logActionMiddleware("Delete Task template", "Task"), deleteTask);
/// /////////////////////////////////////templete permissions///////////////////////////////////////
router.route("/").post(requireAuth, restrictTo(["admin"]), logActionMiddleware("Create permission template", "Permission"), createTempletePermission).get(requireAuth, restrictTo(["admin"]), getTempletes);
router.route("/templeteNames").get(requireAuth, restrictTo(["admin"]), getTempleteNames);
router.route("/:id").get(requireAuth, restrictTo(["admin"]), getTempleteById).patch(requireAuth, restrictTo(["admin"]), logActionMiddleware("Update permission template", "Permission"), updateTemplete).delete(requireAuth, restrictTo(["admin"]), deleteTemplete);

module.exports = router;
