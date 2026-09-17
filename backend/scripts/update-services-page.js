const fs = require("fs");
const filePath = "C:\\Users\\ITPC\\Desktop\\AMS\\frontend\\src\\pages\\services\\ServicesPage.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Add useNavigate import
content = content.replace(
  "import React, { useEffect, useState, useMemo } from 'react';",
  "import React, { useEffect, useState, useMemo } from 'react';\nimport { useNavigate } from 'react-router-dom';"
);

// Add navigate hook
content = content.replace(
  "const ServicesPage: React.FC = () => {",
  "const ServicesPage: React.FC = () => {\n  const navigate = useNavigate();"
);

// Replace the Add Service button
const oldButton = '<button className="btn btn-primary" onClick={openCreateModal}>';
const newButtons = `<div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => navigate('/service-submission')}>
              <FaPlus className="me-2" /> Add Service
            </button>
            <button className="btn btn-outline-secondary" onClick={openCreateModal}>
              <FaEdit className="me-2" /> Quick Add
            </button>
          </div>`;

content = content.replace(oldButton, newButtons);

fs.writeFileSync(filePath, content, "utf8");
console.log("ServicesPage.tsx updated successfully!");
