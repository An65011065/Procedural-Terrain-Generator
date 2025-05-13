import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import react from "@vitejs/plugin-react";

export default defineConfig({
    root: "src/",
    publicDir: "../static/",
    base: "./",
    server: {
        host: true, // Open to local network and display URL
        open: !(
            "SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env
        ), // Open if it's not a CodeSandbox
    },
    build: {
        outDir: "../dist", // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions: {
            external: ["@rollup/rollup-linux-x64-gnu"],
            output: {
                manualChunks: undefined,
            },
        },
    },
    plugins: [glsl(), react()],
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                ".js": "jsx",
            },
        },
    },
});
