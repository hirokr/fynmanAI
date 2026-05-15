import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware for JSON parsing
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
	res.json({ message: "Hello World from Express running on Bun! 🥟" });
});

// Start listening
app.listen(PORT, () => {
	console.log(`🚀 Express server is running on http://localhost:${PORT}`);
});
