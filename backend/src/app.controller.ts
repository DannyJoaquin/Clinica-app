import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  root() {
    return {
      name: 'Clinica API',
      status: 'ok',
      docs: null,
      health: '/health',
      endpoints: ['/auth/*', '/pacientes', '/citas', '/recetas', '/pagos'],
    };
  }
  @Get('health')
  health() {
    return { ok: true };
  }
}
