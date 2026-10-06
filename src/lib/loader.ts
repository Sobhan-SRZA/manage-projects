import { readdirSync } from "fs";
import { Express } from "express";
import path from "path";
import { pathToFileURL } from "url";

export default async function loadRoutes(
    app: Express,
    directory: string,
    prefix: string = ""
) {
    const entries = readdirSync(directory, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const fullPath = path.join(
            directory,
            entry.name
        );

        // Load JavaScript route files
        if (
            entry.isFile() &&
            entry.name.endsWith(".js")
        ) {
            const module = await import(
                pathToFileURL(fullPath).href
            );

            const handle = module.default ?? module;

            if (!handle) {
                console.warn(
                    `No default export found: ${fullPath}`
                );

                continue;
            }

            handle(app);

            console.log(
                `Loaded route: ${prefix || "/"}`
            );

            continue;
        }

        // Recursively load directories
        if (entry.isDirectory()) {
            await loadRoutes(
                app,
                fullPath,
                `${prefix}/${entry.name}`
            );
        }
    }
}