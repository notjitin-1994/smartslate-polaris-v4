const API_KEY = "be923920d99340cbbda05e5cee5ab29c.2TvFcEuEG8hGoktA";
const ENDPOINT = "https://api.z.ai/api/coding/paas/v4/chat/completions";

async function testConnection() {
  console.log("🚀 Testing live connection to Z.ai...");
  console.log("Endpoint:", ENDPOINT);
  
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "glm-5.1",
        messages: [{ role: "user", content: "hi" }],
        stream: false
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Success! Response received:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error("❌ API Error:", response.status, response.statusText);
      console.error("Error Detail:", JSON.stringify(data, null, 2));
      
      if (data.error && data.error.code === "1113") {
        console.error("💡 Analysis: This is the 'Insufficient Balance' error (1113).");
      }
    }
  } catch (error) {
    console.error("💥 Network/Fetch Error:", error.message);
  }
}

testConnection();
