import { readdirSync } from "fs";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const port = 8888;
const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Use json in express get and post
app.use(express.json());

// Load static files path
app.use(express.static(__dirname + "/public"));

readdirSync("./dist/api")
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
        const fileCode = require(`./api/${file}`);
        const fileName = file.split(".")[0];

        app.use(`/api/${fileName}`, fileCode.default || fileCode)
    })

readdirSync("./dist/pages")
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
        const fileCode = require(`./dist/pages/${file}`)

        fileCode(app)
    })

// Redirect all invalid url to /404
app.get("*", (req, res) => {
    res.redirect("/api/404")
})

app.listen(
    port,

    (e) => {
        console.log("App started:", `http://localhost:${port}`);
    }
)

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */