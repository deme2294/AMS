const { validateFileType, ALLOWED_IMAGE_TYPES } = require("./middleware/uploadMiddleware");
const fs = require("fs");
const path = require("path");

async function runAdvancedTests() {
    console.log(" STARTING ADVANCED UPLOAD SECURITY AUDIT ");

    const tests = [
        {
            name: "Audit 1: Polyglot GIF (Valid GIF Sig + <script>)",
            content: Buffer.concat([
                Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00]), 
                Buffer.from("<script>alert(1)</script>")
            ]),
            filename: "polyglot.gif",
            declaredMime: "image/gif",
            expected: false
        },
        {
            name: "Audit 2: JPEG + SVG Metadata (onload)",
            content: Buffer.concat([
                Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]),
                Buffer.from("<svg/onload=alert(1)>")
            ]),
            filename: "metadata_xss.jpg",
            declaredMime: "image/jpeg",
            expected: false
        }
    ];

    for (const test of tests) {
        const filePath = path.join(__dirname, test.filename);
        fs.writeFileSync(filePath, test.content);
        try {
            const isValid = await validateFileType(filePath, test.declaredMime, ALLOWED_IMAGE_TYPES);
            console.log(`Test: ${test.name} -> ${isValid ? "ACCEPTED" : "REJECTED"}`);
            console.log(isValid === test.expected ? " PASSED" : " FAILED");
        } catch (e) {
            console.log("Error:", e.message);
        }
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}
runAdvancedTests();
