const express = require('express');
const planController = require('../controllers/planController');

const router = express.Router();

router.route('/').post(planController.createPlan).get(planController.getPlans);

router.route('/:planFor').get(planController.getPlansByPlanFor);

router.route('/:id').patch(planController.updatePlan).delete(planController.deletePlan);

module.exports = router;
