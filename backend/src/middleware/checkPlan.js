const { PLAN_FEATURES } = require('../config/planFeatures');
const { error } = require('../utils/response');

// Usage: checkPlan('expenses')  checkPlan('custom_roles')  etc.
function checkPlan(feature) {
  return (req, res, next) => {
    const plan = req.plan || 'free';
    const allowed = PLAN_FEATURES[feature] || [];

    if (!allowed.includes(plan)) {
      const required = allowed[0] || 'standard';
      return error(
        res,
        `Your current plan (${plan}) does not include this feature. Upgrade to ${required} or higher.`,
        403,
        'PLAN_RESTRICTED'
      );
    }
    next();
  };
}

module.exports = checkPlan;
