const subAdminspermissions = [
    'dashboard', "inbox", "calendar", "serviceManagement", "vendorManagement", "userManagement", "subAdmins", "totalBookings", "disputes", "finance", "payouts", "paymentGateway", "manageCountry", "staff", "manageCity", "pricing", "products", "orders", "settings", "review", "reports", "advertisement", "logs", "help", "accounts", "template", "bookings","newsletter","notification","categoryManagement","clientReviews"]

const newsletterPermissions = [
    'country', 'city'

]
module.exports = {
    permissions: {
        subAdmin: subAdminspermissions,
        newsletter: newsletterPermissions
    }
}

