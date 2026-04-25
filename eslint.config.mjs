import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "out/**",
      "src/generated/prisma/**"
    ]
  },
  ...nextVitals
];

export default eslintConfig;
