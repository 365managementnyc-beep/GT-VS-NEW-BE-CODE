const axios = require('axios');
async function triggerAlertReply(data) {
    try {
        const response = await axios.post('http://3.132.133.235:8000/alert-reply/', data);
        return response.data;
    } catch (error) {
        // Handle error as needed
        throw error;
    }
}

module.exports = { triggerAlertReply };