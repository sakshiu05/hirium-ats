const adminPermissions = ['admin'];
const developerPermissions = ['individual-engineer'];
const teamPermissions = ['admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'human_resources', 'cx_admin', 'cx_associate'];
const allPermissions = ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources', 'cx_admin', 'cx_associate'];
const atsAdminPermission = ['admin', 'ats_superadmin', 'ats_admin', 'ats_super_admin'];
const atsAllPermission = ['ats_superadmin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'ats_super_admin'];

module.exports = {
    adminPermissions,
    developerPermissions,
    teamPermissions,
    allPermissions,
    atsAdminPermission,
    atsAllPermission,
};
