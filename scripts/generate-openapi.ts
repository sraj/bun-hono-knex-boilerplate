import bun from 'bun';
import swaggerJSDoc from 'swagger-jsdoc';

const packageJson = await bun.file('./package.json').json();

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'bun-hono-knex-boilerplate',
      version: packageJson.version,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Bearer',
          description:
            'Paste the token from sign-up or sign-in response. Click Authorize, then enter "<token>" (without "Bearer " prefix).',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const openapiSpec = swaggerJSDoc(options);

await bun.write('./docs/openapi.json', JSON.stringify(openapiSpec, null, 2));
console.log(
  `OpenAPI JSON (v${packageJson.version}) saved in /docs/openapi.json`,
);
