"use strict";

// Include the app.js file.
console.log("entrypoint");
const app = require("./app/app.js");

// Define port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});