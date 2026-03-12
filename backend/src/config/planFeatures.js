// Defines which plans unlock which features.
// Add new features here — checkPlan middleware reads from this map.

const PLAN_FEATURES = {
  expenses:       ['standard', 'premium'],  // view, create, approve expenses
  file_uploads:   ['standard', 'premium'],  // upload bill attachments
  custom_roles:   ['standard', 'premium'],  // create / edit / delete roles
  family_delete:  ['standard', 'premium'],  // delete families and members
  unlimited_users:['standard', 'premium'],  // more than 1 user account
  white_label:    ['premium'],              // update logo, theme color
};

const FREE_MAX_USERS = 1;

const PLAN_LABELS = {
  free:     'Free',
  standard: 'Standard',
  premium:  'Premium',
};

module.exports = { PLAN_FEATURES, FREE_MAX_USERS, PLAN_LABELS };
