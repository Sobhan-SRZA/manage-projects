import loadRoutes from "./lib/loader";
import express from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const port = 8888;
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "../src/public")
    )
);

const routes = [
    {
        dir: "pages",
        prefix: ""
    },
    {
        dir: "api",
        prefix: "/api"
    }
];

Promise.all(
    routes.map(async route => {
        await loadRoutes(
            app,
            path.join(__dirname, route.dir),
            route.prefix
        );
    })
)

// Redirect all invalid URLs to /404
// app.get("/{*splat}", (req, res) => {
//     res.redirect("/404");
// });

app.listen(port, () => {
    console.log(
        "App started:",
        `http://localhost:${port}`
    );
});

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */