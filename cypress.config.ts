import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3000", // Altere para a URL da sua aplicação Next.js
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});