const express = require('express');
const app = express();
const PORT = process.env.PORT || 5005;

app.get('/', (req, res) => {
    res.json({
        message: "🚀 API IS ALIVE!",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || "not set",
        cwd: process.cwd()
    });
});

app.listen(PORT, () => {
    console.log(`Diagnostic server running on port ${PORT}`);
});
