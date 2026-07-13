import { describe, expect, it, vi } from 'vitest';

import { oAuth2Login } from './auth';

vi.mock('#/api/request', () => ({
  baseRequestClient: {
    post: vi.fn(),
  },
}));

vi.mock('#/utils/passwordCrypto', () => ({
  encryptPassword: vi.fn(() => 'encrypted-password'),
}));

describe('OAuth2 adapter', () => {
  it('should call /auth/oauth2/token with correct params', async () => {
    const { baseRequestClient } = await import('#/api/request');
    const mockPost = vi.mocked(baseRequestClient.post);
    mockPost.mockResolvedValue({
      data: {
        access_token: 'test-access-token',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
      },
    });

    const result = await oAuth2Login({
      code: 'verification-code',
      password: '123456',
      randomStr: 'blockPuzzle',
      username: 'admin',
    });

    expect(result.access_token).toBe('test-access-token');
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/oauth2/token',
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic'),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      }),
    );
  });
});
