"use strict";

const app = require("./express/server");

app.listen(3000, "127.0.0.1", () =>
    console.log(`Example app listening at http://127.0.0.1:3000`)
);
