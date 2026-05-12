const fs = require('fs');
const file = 'c:/laragon/www/fixora-rms/app/admin/tools-management/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import toast
if (!content.includes("import { toast }")) {
  content = content.replace('"use client";', '"use client";\nimport { toast } from "react-toastify";');
}

// Remove setStatus state
content = content.replace(/const \[status, setStatus\] = useState.*?\n/, '');

// Remove setStatus(null)
content = content.replace(/setStatus\(null\);/g, '');

// Replace setStatus success/error
content = content.replace(/setStatus\(\{ type: "success", message: (.*?) \}\);/g, 'toast.success($1);');
content = content.replace(/setStatus\(\{ type: "error", message: (.*?) \}\);/g, 'toast.error($1);');

// Remove the status div block in the UI
content = content.replace(/\{\s*status && \(\s*<div[\s\S]*?<\/div>\s*\)\s*\}/g, '');

fs.writeFileSync(file, content);
console.log('done');
