const axios = require('axios');
const fs = require('fs');
async function run() {
  try {
    const res = await axios.post("http://localhost:5001/api/reports/analyze", {
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      mimeType: "image/png"
    });
    console.log("Success:", res.data);
  } catch(e) {
    console.log("Error details:");
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
