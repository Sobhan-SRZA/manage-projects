import app from "./app";
import { connectDB } from "./config/db";
import { config } from "./config/env";

const startServer = async () => {
    // Connect to the database first
    await connectDB();

    // Then start the Express server
    app.listen(config.port, () => {
        console.log(`Server running on http://localhost:${config.port}`);
    });
};

startServer();

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */