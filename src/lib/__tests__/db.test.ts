import { describe, it, expect } from 'vitest';

describe('Database Schema', () => {
  it('should have starmaps table defined', async () => {
    const { starmaps } = await import('../db/schema');
    expect(starmaps).toBeDefined();
  });

  it('should have starmapResponses table defined', async () => {
    const { starmapResponses } = await import('../db/schema');
    expect(starmapResponses).toBeDefined();
  });

  it('should have proper relations defined', async () => {
    const { starmapsRelations, starmapResponsesRelations } = await import('../db/schema');
    expect(starmapsRelations).toBeDefined();
    expect(starmapResponsesRelations).toBeDefined();
  });
});
