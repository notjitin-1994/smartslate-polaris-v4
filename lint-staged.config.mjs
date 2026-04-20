/** @type {import('lint-staged').Config} */
const config = {
  "frontend/**/*.{js,jsx,ts,tsx}": (files) => {
    const frontendFiles = files
      .filter((f) => f.startsWith("frontend/"))
      .map((f) => f.replace(/^frontend\//, ""));
    if (frontendFiles.length === 0) return [];
    const fileList = frontendFiles.map((f) => `"${f}"`).join(" ");
    return [
      `cd frontend && eslint --fix ${fileList}`,
      `cd frontend && prettier --write ${fileList}`,
    ];
  },
  "frontend/**/*.{json,css,md}": (files) => {
    const frontendFiles = files
      .filter((f) => f.startsWith("frontend/"))
      .map((f) => f.replace(/^frontend\//, ""));
    if (frontendFiles.length === 0) return [];
    const fileList = frontendFiles.map((f) => `"${f}"`).join(" ");
    return [`cd frontend && prettier --write ${fileList}`];
  },
};

export default config;



