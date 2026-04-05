/** @type {import('@wolent/core').ServerConfig} */
export default {
  host: process.env.HOST ?? '0.0.0.0',
  port: parseInt(process.env.PORT ?? '3000'),
}
