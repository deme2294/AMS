const fs = require("fs");
const filePath = "C:\\Users\\ITPC\\Desktop\\AMS\\frontend\\src\\pages\\services\\ServicesPage.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Find and fix the broken section
const brokenSection = `<div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => navigate('/service-submission')}>\n              <FaPlus className="me-2" /> Add Service\n            </button>\n            <button className="btn btn-outline-secondary" onClick={openCreateModal}>\n              <FaEdit className="me-2" /> Quick Add\n            </button>\n          </div>\n          <FaPlus className="me-2" /> Add Service\n        </button>`;

const fixedSection = `<div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => navigate('/service-submission')}>\n              <FaPlus className="me-2" /> Add Service\n            </button>\n            <button className="btn btn-outline-secondary" onClick={openCreateModal}>\n              <FaEdit className="me-2" /> Quick Add\n            </button>\n          </div>`;

content = content.replace(brokenSection, fixedSection);
fs.writeFileSync(filePath, content, "utf8");
console.log("Fixed ServicesPage.tsx!");
