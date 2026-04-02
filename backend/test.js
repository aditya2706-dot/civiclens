const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '69b2d29ea8b2917cf4ff070f' }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

axios.get('http://localhost:5001/api/reports/my', {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
    console.log("Status:", res.status);
    console.log("Data length:", res.data.length);
})
.catch(err => {
    console.error("Error:", err.message);
    if(err.response) console.error(err.response.data);
});
