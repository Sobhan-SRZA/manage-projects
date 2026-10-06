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
            (
                entry.name.endsWith(".js") ||
                entry.name.endsWith(".ts")
            )
        ) {
            const module = await import(
                pathToFileURL(fullPath).href
            );

            const router = entry.name.endsWith(".ts") ? module.default : module.default.default;

            if (!router) {
                console.warn(
                    `No default export found: ${fullPath}`
                );

                continue;
            }

            app.use(
                prefix || "/",
                router
            );

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