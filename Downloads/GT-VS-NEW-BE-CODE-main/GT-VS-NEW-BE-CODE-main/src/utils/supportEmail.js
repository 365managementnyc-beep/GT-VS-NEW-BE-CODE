
 
const notifySupportTeam = async (userEmail, issue, priority = 'normal') => {
    const subject = `[${priority.toUpperCase()}] New support request from ${userEmail}`;
    const html = `
        <h3>New Support Request</h3>
        <p><strong>From:</strong> ${userEmail}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Issue:</strong></p>
        <p>${issue}</p>
    `;

    return await sendSupportEmail({
        to: process.env.SUPPORT_TEAM_EMAIL,
        subject,
        html,
        text: `New support request from ${userEmail}\nPriority: ${priority}\nIssue: ${issue}`
    });
};

module.exports = {
    sendSupportEmail,
    notifySupportTeam
};