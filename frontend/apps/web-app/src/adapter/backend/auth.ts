import { baseRequestClient } from '#/api/request';
import { encryptPassword } from '#/utils/passwordCrypto';

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface LoginParams {
  username: string;
  password: string;
  randomStr: string;
  code: string;
  grant_type?: string;
  scope?: string;
}

function getBasicAuth(): string {
  const clientInfo = import.meta.env.VITE_OAUTH2_PASSWORD_CLIENT || 'edms:';
  return `Basic ${window.btoa(clientInfo)}`;
}

function buildFormData(params: Record<string, any>): URLSearchParams {
  const data = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      data.append(key, String(value));
    }
  });
  return data;
}

/**
 * OAuth2 密码模式登录
 */
export async function oAuth2Login(params: LoginParams): Promise<OAuth2TokenResponse> {
  const { password, username, randomStr, code } = params;
  const encryptedPassword = encryptPassword(password);

  const data = buildFormData({
    code,
    grant_type: params.grant_type || 'password',
    password: encryptedPassword,
    randomStr,
    scope: params.scope || 'server',
    username,
  });

  const response = await baseRequestClient.post<OAuth2TokenResponse>(
    '/auth/oauth2/token',
    data,
    {
      headers: {
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  return response.data;
}

/**
 * 刷新 access token
 */
export async function oAuth2RefreshToken(refreshToken: string): Promise<OAuth2TokenResponse> {
  const data = buildFormData({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'server',
  });

  const response = await baseRequestClient.post<OAuth2TokenResponse>(
    '/auth/oauth2/token',
    data,
    {
      headers: {
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  return response.data;
}

/**
 * 登出
 */
export async function oAuth2Logout(): Promise<void> {
  await baseRequestClient.delete('/auth/token/logout', {
    headers: {
      'Authorization': getBasicAuth(),
    },
  });
}

/**
 * 检查 token 有效性
 */
export async function oAuth2CheckToken(token: string) {
  const response = await baseRequestClient.get('/auth/token/check_token', {
    headers: {
      'Authorization': getBasicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    params: { token },
  });
  return response.data;
}
