import { baseRequestClient, requestClient } from '#/api/request';
import {
  oAuth2CheckToken,
  oAuth2Login,
  oAuth2Logout,
  oAuth2RefreshToken,
} from '#/adapter/backend/auth';

export namespace AuthApi {
  export interface LoginParams {
    code: string;
    password: string;
    randomStr: string;
    username: string;
  }

  export interface LoginResult {
    accessToken: string;
    refreshToken?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const result = await oAuth2Login({
    code: data.code,
    password: data.password,
    randomStr: data.randomStr,
    username: data.username,
  });
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  };
}

/**
 * 刷新 accessToken
 */
export async function refreshTokenApi() {
  // 从 accessStore 获取 refreshToken，这里保持与 request.ts 的约定
  const { useAccessStore } = await import('@vben/stores');
  const accessStore = useAccessStore();
  const refreshToken = accessStore.refreshToken;
  if (!refreshToken) {
    throw new Error('Refresh token is missing');
  }
  const result = await oAuth2RefreshToken(refreshToken);
  return {
    data: result.access_token,
    status: 0,
  } as AuthApi.RefreshTokenResult;
}

/**
 * 退出登录
 */
export async function logoutApi() {
  await oAuth2Logout();
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get('/admin/user/info');
}

/**
 * 检查 token 是否有效
 */
export async function checkTokenApi(token: string) {
  return oAuth2CheckToken(token);
}
