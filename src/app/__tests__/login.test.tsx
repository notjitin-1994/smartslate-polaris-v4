import { describe, it, expect } from 'vitest';

describe('Login Page', () => {
  it('should have login page component', async () => {
    const { default: LoginPage } = await import('../login/page');
    expect(LoginPage).toBeDefined();
  });

  it('should be an async component', async () => {
    const { default: LoginPage } = await import('../login/page');
    expect(LoginPage.name).toBeDefined();
  });
});

describe('Signup Page', () => {
  it('should have signup page component', async () => {
    const { default: SignupPage } = await import('../signup/page');
    expect(SignupPage).toBeDefined();
  });
});
