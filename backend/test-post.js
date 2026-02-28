const axios = require('axios');
async function run() {
  try {
    const res = await axios.post("http://localhost:5001/api/reports", {
      imageUrl: "data:image/jpeg;base64,test",
      category: "Other",
      aiSummary: "test",
      detectedObjects: [],
      severity: "Medium",
      location: { lat: 0, lng: 0 },
      isAnonymous: false
    });
    console.log(res.data);
  } catch(e) {
    console.log("Error details:");
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
