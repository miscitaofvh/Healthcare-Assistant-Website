const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors()); 
app.use(express.json());

app.post("/api/login", (req, res) => {
    console.log("Received login request:", req.body); 
    const { username, password } = req.body;
    if (username === "miscitaofvh" && password === "ngvanhung.sun") {
        console.log("Received login request:", username); 
        res.json({ message: "Login successful", token: "abcdef" , success: true});
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

app.listen(5000, () => console.log("Backend running on port 5000"));
