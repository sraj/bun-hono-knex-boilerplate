import { db } from '../../shared/database';
export class HealthService {
  async checkApi() {
    return { status: 'OK' };
  }

  async checkDatabase() {
    await db.raw('SELECT 1');
    return { status: 'Database connected successfully' };
  }
}
