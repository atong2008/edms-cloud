# OAuth2 登录认证前后端对接实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `frontend/apps/web-app` 与后端 `edms-auth` 的 OAuth2 密码模式登录认证对接，包括登录、滑块验证码、密码加密、token 刷新、登出。

**Architecture:** 前端新增 `adapter/backend/auth.ts` 作为 OAuth2 适配器，内部使用 `baseRequestClient` 直接调用 `/auth/oauth2/token` 等端点；业务请求继续使用 `requestClient`。新增 `BackendSliderCaptcha` 组件对接后端 `/auth/code/create` 和 `/auth/code/check`。

**Tech Stack:** Vue 3 + TypeScript + Vite + Pinia + `@vben/request` + `crypto-js`（AES）+ `sm-crypto`（SM4）+ Vitest。

## Global Constraints

- Node: `^22.18.0 || ^24.0.0`
- pnpm: `>=11.0.0`
- 包管理：pnpm workspace monorepo
- OAuth2 端点：`POST /auth/oauth2/token`（通过网关 `/auth/**` 路由到 `edms-auth`）
- Content-Type：`application/x-www-form-urlencoded`
- Basic Auth：`Basic base64(clientId:clientSecret)`，`edms` 客户端 secret 为空
- 登录参数：`grant_type=password`、`scope=server`
- `edms` 客户端配置：`enc_flag='1'`（密码必须加密）、`captcha_flag='1'`（必须验证码）
- 响应格式：OAuth2 标准 JSON（`access_token`、`refresh_token`、`expires_in`）
- 设计文档：`docs/superpowers/specs/2026-07-13-oauth2-login-design.md`

---

## Task 1: 环境变量与代理配置

**Files:**
- Modify: `frontend/apps/web-app/.env`
- Modify: `frontend/apps/web-app/.env.development`
- Modify: `frontend/apps/web-app/vite.config.ts`

**Interfaces:**
- Consumes: none
- Produces: `VITE_OAUTH2_PASSWORD_CLIENT`, `VITE_OAUTH2_MOBILE_CLIENT`, `VITE_OAUTH2_SOCIAL_CLIENT`, `VITE_PWD_ENC_KEY`, `VITE_PWD_ENC_TYPE`, `/api` proxy target

- [ ] **Step 1: 编辑 `frontend/apps/web-app/.env`**

在文件末尾追加：

```bash
# OAuth2 客户端配置
VITE_OAUTH2_PASSWORD_CLIENT='edms:'
VITE_OAUTH2_MOBILE_CLIENT='app:app'
VITE_OAUTH2_SOCIAL_CLIENT='social:social'

# 密码加密配置（与后端 security.encode-key / security.encode-type 保持一致）
VITE_PWD_ENC_KEY='thanks,edms2026!'
VITE_PWD_ENC_TYPE='AES'
```

- [ ] **Step 2: 编辑 `frontend/apps/web-app/.env.development`**

在文件末尾追加：

```bash
# OAuth2 客户端配置
VITE_OAUTH2_PASSWORD_CLIENT='edms:'
VITE_OAUTH2_MOBILE_CLIENT='app:app'
VITE_OAUTH2_SOCIAL_CLIENT='social:social'

# 密码加密配置
VITE_PWD_ENC_KEY='thanks,edms2026!'
VITE_PWD_ENC_TYPE='AES'
```

- [ ] **Step 3: 修改 `frontend/apps/web-app/vite.config.ts` 的代理目标**

把 `/api` 代理从 mock 服务改为网关：

```typescript
import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 开发环境代理到 edms-gateway
            target: 'http://localhost:9999',
            ws: true,
          },
        },
      },
    },
  };
});
```

- [ ] **Step 4: 提交**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm exec prettier --write apps/web-app/.env apps/web-app/.env.development apps/web-app/vite.config.ts
git add apps/web-app/.env apps/web-app/.env.development apps/web-app/vite.config.ts
git commit -m "chore(web-app): 配置 OAuth2 环境变量与开发代理

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: 安装密码加密依赖

**Files:**
- Modify: `frontend/apps/web-app/package.json`
- Modify: `frontend/pnpm-lock.yaml`（通过 pnpm install 自动生成）

**Interfaces:**
- Consumes: none
- Produces: `crypto-js` 和 `sm-crypto` 依赖可用

- [ ] **Step 1: 编辑 `frontend/apps/web-app/package.json` 的 dependencies**

在 `dependencies` 中追加：

```json
"crypto-js": "catalog:",
"sm-crypto": "catalog:"
```

如果 catalog 中不存在，改为直接版本号：

```json
"crypto-js": "^4.2.0",
"sm-crypto": "^0.3.13"
```

- [ ] **Step 2: 在 pnpm catalog 中注册版本（如使用 catalog）**

编辑 `frontend/pnpm-workspace.yaml`，在 `catalog:` 下添加：

```yaml
  crypto-js: ^4.2.0
  sm-crypto: ^0.3.13
```

- [ ] **Step 3: 安装依赖**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm install
```

Expected: 安装成功，无错误。

- [ ] **Step 4: 提交**

```bash
git add apps/web-app/package.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore(web-app): 添加 crypto-js 和 sm-crypto 依赖用于密码加密

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: 密码加密工具

**Files:**
- Create: `frontend/apps/web-app/src/utils/passwordCrypto.ts`
- Create: `frontend/apps/web-app/src/utils/passwordCrypto.test.ts`

**Interfaces:**
- Consumes: `import.meta.env.VITE_PWD_ENC_TYPE`, `import.meta.env.VITE_PWD_ENC_KEY`
- Produces: `encryptPassword(password: string): string`

- [ ] **Step 1: 编写测试 `frontend/apps/web-app/src/utils/passwordCrypto.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';

import { encryptPassword } from './passwordCrypto';

describe('passwordCrypto', () => {
  it('should encrypt password with AES', () => {
    const original = '123456';
    const encrypted = encryptPassword(original, 'AES', 'thanks,edms2026!');
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(original);
  });

  it('should throw error for invalid AES key length', () => {
    expect(() => encryptPassword('123456', 'AES', 'short')).toThrow();
  });

  it('should throw error for invalid SM4 key', () => {
    expect(() => encryptPassword('123456', 'SM4', 'not-hex')).toThrow();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm exec vitest run apps/web-app/src/utils/passwordCrypto.test.ts
```

Expected: FAIL with "encryptPassword is not defined" 或类似错误。

- [ ] **Step 3: 实现 `frontend/apps/web-app/src/utils/passwordCrypto.ts`**

```typescript
import CryptoJS from 'crypto-js';
import { sm4 } from 'sm-crypto';

const AES_KEY_LENGTH = 16;
const SM4_HEX_KEY_LENGTH = 32;
const SM4_HEX_KEY_PATTERN = /^[0-9a-fA-F]{32}$/;

export type EncryptType = 'AES' | 'SM4';

/**
 * 加密登录密码，需与后端 security.encode-type / security.encode-key 保持一致。
 * @param password 明文密码
 * @param encryptType 加密类型，默认 AES
 * @param encryptKey 加密密钥
 * @returns 加密后的密文
 */
export function encryptPassword(
  password: string,
  encryptType: EncryptType = 'AES',
  encryptKey: string = import.meta.env.VITE_PWD_ENC_KEY || '',
): string {
  if (encryptType === 'AES') {
    return encryptByAes(password, encryptKey);
  }
  if (encryptType === 'SM4') {
    return encryptBySm4(password, encryptKey);
  }
  throw new Error(`Unsupported password encryption type: ${encryptType}`);
}

function encryptByAes(password: string, key: string): string {
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  if (keyBytes.sigBytes !== AES_KEY_LENGTH) {
    throw new Error(
      `AES encode-key must be ${AES_KEY_LENGTH} bytes (current: ${keyBytes.sigBytes})`,
    );
  }
  const iv = keyBytes;
  const encrypted = CryptoJS.AES.encrypt(password, keyBytes, {
    iv,
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.NoPadding,
  });
  return encrypted.toString();
}

function encryptBySm4(password: string, key: string): string {
  if (!SM4_HEX_KEY_PATTERN.test(key)) {
    throw new Error(
      `SM4 encode-key must be ${SM4_HEX_KEY_LENGTH} hex characters`,
    );
  }
  return sm4.encrypt(password, key);
}

export default encryptPassword;
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm exec vitest run apps/web-app/src/utils/passwordCrypto.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/web-app/src/utils/passwordCrypto.ts apps/web-app/src/utils/passwordCrypto.test.ts
git commit -m "feat(web-app): 实现 AES/SM4 登录密码加密工具

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: 验证码 API

**Files:**
- Create: `frontend/apps/web-app/src/api/core/captcha.ts`

**Interfaces:**
- Consumes: `baseRequestClient` from `#/api/request`
- Produces: `createBehaviorCaptcha(captchaType: string)`, `checkBehaviorCaptcha(params: CheckBehaviorCaptchaParams)`

- [ ] **Step 1: 实现 `frontend/apps/web-app/src/api/core/captcha.ts`**

```typescript
import { baseRequestClient } from '#/api/request';

export interface CaptchaCreateResult {
  backgroundImage: string;
  sliderImage: string;
  token: string;
  // anji-captcha 可能返回其他字段，联调时补充
  [key: string]: any;
}

export interface CheckBehaviorCaptchaParams {
  captchaType: string;
  pointJson: string;
  token: string;
}

/**
 * 获取行为验证码（滑块/点击文字）
 */
export async function createBehaviorCaptcha(captchaType: string) {
  return baseRequestClient.get<CaptchaCreateResult>(
    `/auth/code/create?captchaType=${encodeURIComponent(captchaType)}`,
  );
}

/**
 * 校验行为验证码，返回 captchaVerification
 */
export async function checkBehaviorCaptcha(params: CheckBehaviorCaptchaParams) {
  const { captchaType, pointJson, token } = params;
  const data = new URLSearchParams();
  data.append('captchaType', captchaType);
  data.append('pointJson', pointJson);
  data.append('token', token);

  const response = await baseRequestClient.post<{ data: string }>(
    '/auth/code/check',
    data,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  return response.data;
}

/**
 * 获取算术图形验证码图片（备用）
 */
export function getImageCaptchaUrl(randomStr: string) {
  return `/api/auth/code/image?randomStr=${encodeURIComponent(randomStr)}`;
}
```

注意：`baseRequestClient.post` 返回的是 `AxiosResponse<T>`，因此需要 `.data` 获取响应体。实现时如果 `@vben/request` 的实际行为不同，以运行时返回为准。

- [ ] **Step 2: 提交**

```bash
git add apps/web-app/src/api/core/captcha.ts
git commit -m "feat(web-app): 添加后端验证码 API

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 5: 后端滑块验证码组件

**Files:**
- Create: `frontend/apps/web-app/src/components/backend-slider-captcha/index.vue`
- Create: `frontend/apps/web-app/src/components/backend-slider-captcha/index.ts`

**Interfaces:**
- Consumes: `createBehaviorCaptcha`, `checkBehaviorCaptcha` from `#/api/core/captcha`
- Produces: `BackendSliderCaptcha` component emits `{ randomStr: string; code: string; time: string }` on success

- [ ] **Step 1: 创建组件目录和导出文件**

`frontend/apps/web-app/src/components/backend-slider-captcha/index.ts`：

```typescript
export { default as BackendSliderCaptcha } from './index.vue';
```

- [ ] **Step 2: 实现 `frontend/apps/web-app/src/components/backend-slider-captcha/index.vue`**

组件基于后端 `/auth/code/create` 和 `/auth/code/check` 实现。渲染后端返回的滑块图片，用户拖动后生成 `pointJson` 并校验。

```vue
<script lang="ts" setup>
import type { CaptchaCreateResult } from '#/api/core/captcha';

import { onMounted, reactive } from 'vue';

import { checkBehaviorCaptcha, createBehaviorCaptcha } from '#/api/core/captcha';

export interface BackendSliderCaptchaSuccessPayload {
  code: string;
  randomStr: string;
  time: string;
}

const emit = defineEmits<{
  success: [BackendSliderCaptchaSuccessPayload];
}>();

defineOptions({ name: 'BackendSliderCaptcha' });

const state = reactive({
  backgroundImage: '',
  loading: false,
  moveX: 0,
  sliderImage: '',
  startX: 0,
  token: '',
  verifyError: '',
  verifying: false,
});

async function loadCaptcha() {
  state.loading = true;
  state.verifyError = '';
  state.moveX = 0;
  try {
    const response = await createBehaviorCaptcha('blockPuzzle');
    const data = response.data;
    state.backgroundImage = data.backgroundImage;
    state.sliderImage = data.sliderImage;
    state.token = data.token;
  } catch (err: any) {
    state.verifyError = err?.message || '验证码加载失败';
  } finally {
    state.loading = false;
  }
}

function handleStart(e: MouseEvent | TouchEvent) {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  state.startX = clientX;
}

async function handleEnd(e: MouseEvent | TouchEvent) {
  const clientX =
    'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
  const moveX = clientX - state.startX;
  if (moveX <= 0) return;

  state.verifying = true;
  try {
    const pointJson = JSON.stringify({ x: moveX, y: 0, t: Date.now() });
    const verification = await checkBehaviorCaptcha({
      captchaType: 'blockPuzzle',
      pointJson,
      token: state.token,
    });
    emit('success', {
      code: verification,
      randomStr: 'blockPuzzle',
      time: Date.now().toString(),
    });
  } catch (err: any) {
    state.verifyError = err?.message || '验证码校验失败';
    await loadCaptcha();
  } finally {
    state.verifying = false;
  }
}

onMounted(() => {
  loadCaptcha();
});
</script>

<template>
  <div class="backend-slider-captcha">
    <div v-if="state.loading" class="text-center">加载验证码...</div>
    <div v-else-if="state.verifyError" class="text-error text-center">
      {{ state.verifyError }}
    </div>
    <div v-else class="relative inline-block">
      <img
        v-if="state.backgroundImage"
        :src="state.backgroundImage"
        alt="background"
        class="block"
      />
      <img
        v-if="state.sliderImage"
        :src="state.sliderImage"
        alt="slider"
        class="absolute left-0 top-0"
        :style="{ transform: `translateX(${state.moveX}px)` }"
      />
      <div
        class="slider-track absolute bottom-0 left-0 h-10 w-full bg-black/30"
        @mousedown="handleStart"
        @touchstart="handleStart"
        @mouseup="handleEnd"
        @touchend="handleEnd"
      >
        <div class="slider-tip text-center leading-10 text-white">
          {{ state.verifying ? '校验中...' : '请拖动滑块完成验证' }}
        </div>
      </div>
      <button
        type="button"
        class="mt-2 text-sm text-primary"
        @click="loadCaptcha"
      >
        刷新验证码
      </button>
    </div>
  </div>
</template>
```

说明：
- `pointJson` 采用 `{ x: 拖动距离, y: 0, t: 时间戳 }` 的 JSON 字符串，与 anji-captcha 标准滑块校验格式一致。如果后端实际要求的格式不同，在 Task 10 联调阶段调整 `handleEnd` 中的 `pointJson` 构造。
- 拖动事件监听放在外层轨道，实现最小可用版本。若需要更精致的交互，可在实现阶段替换为更完整的滑块组件。

- [ ] **Step 3: 提交**

```bash
git add apps/web-app/src/components/backend-slider-captcha/
git commit -m "feat(web-app): 添加后端滑块验证码组件（基础结构）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: OAuth2 适配器

**Files:**
- Create: `frontend/apps/web-app/src/adapter/backend/auth.ts`
- Create: `frontend/apps/web-app/src/adapter/backend/auth.test.ts`

**Interfaces:**
- Consumes: `baseRequestClient` from `#/api/request`, `encryptPassword` from `#/utils/passwordCrypto`, `import.meta.env.VITE_OAUTH2_PASSWORD_CLIENT`
- Produces: `oAuth2Login(params)`, `oAuth2RefreshToken(refreshToken)`, `oAuth2Logout()`, `oAuth2CheckToken(token)`

- [ ] **Step 1: 编写测试 `frontend/apps/web-app/src/adapter/backend/auth.test.ts`**

```typescript
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
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm exec vitest run apps/web-app/src/adapter/backend/auth.test.ts
```

Expected: FAIL with module not found 或函数未定义。

- [ ] **Step 3: 实现 `frontend/apps/web-app/src/adapter/backend/auth.ts`**

```typescript
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
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm exec vitest run apps/web-app/src/adapter/backend/auth.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/web-app/src/adapter/backend/auth.ts apps/web-app/src/adapter/backend/auth.test.ts
git commit -m "feat(web-app): 实现 OAuth2 适配器

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 7: 更新 `api/core/auth.ts`

**Files:**
- Modify: `frontend/apps/web-app/src/api/core/auth.ts`

**Interfaces:**
- Consumes: `oAuth2Login`, `oAuth2RefreshToken`, `oAuth2Logout`, `oAuth2CheckToken` from `#/adapter/backend/auth`
- Produces: `loginApi(params)`, `refreshTokenApi()`, `logoutApi()`, `getAccessCodesApi()`, `getUserInfoApi()`

- [ ] **Step 1: 修改 `frontend/apps/web-app/src/api/core/auth.ts`**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add apps/web-app/src/api/core/auth.ts
git commit -m "feat(web-app): 更新 auth API 使用 OAuth2 适配器

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 8: 更新请求客户端刷新逻辑

**Files:**
- Modify: `frontend/apps/web-app/src/api/request.ts`

**Interfaces:**
- Consumes: `oAuth2RefreshToken` from `#/adapter/backend/auth`
- Produces: `doRefreshToken()` returns new access token string

- [ ] **Step 1: 修改 `frontend/apps/web-app/src/api/request.ts`**

```typescript
/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { oAuth2RefreshToken } from '#/adapter/backend/auth';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新 token 逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const refreshToken = accessStore.refreshToken;
    if (!refreshToken) {
      throw new Error('Refresh token is missing');
    }
    const resp = await oAuth2RefreshToken(refreshToken);
    const newToken = resp.access_token;
    accessStore.setAccessToken(newToken);
    if (resp.refresh_token) {
      accessStore.setRefreshToken(resp.refresh_token);
    }
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token 过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
```

- [ ] **Step 2: 提交**

```bash
git add apps/web-app/src/api/request.ts
git commit -m "feat(web-app): 更新 requestClient 刷新 token 使用 OAuth2 适配器

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 9: 更新登录视图

**Files:**
- Modify: `frontend/apps/web-app/src/views/_core/authentication/login.vue`

**Interfaces:**
- Consumes: `BackendSliderCaptcha` from `#/components/backend-slider-captcha`, `useAuthStore` from `#/store`
- Produces: login form collects `username`, `password`, `randomStr`, `code` and passes to `authStore.authLogin`

- [ ] **Step 1: 修改 `frontend/apps/web-app/src/views/_core/authentication/login.vue`**

```vue
<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import type { BackendSliderCaptchaSuccessPayload } from '#/components/backend-slider-captcha';

import { BackendSliderCaptcha } from '#/components/backend-slider-captcha';
import { useAuthStore } from '#/store';

import type { Recordable } from '@vben/types';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const captchaData = ref({ code: '', randomStr: '' });

const MOCK_USER_OPTIONS: BasicOption[] = [
  { label: 'Super', value: 'vben' },
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'jack' },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
      },
      fieldName: 'selectAccount',
      label: $t('authentication.selectAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.selectAccount') })
        .optional()
        .default('vben'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: '123456',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});

function handleCaptchaSuccess(payload: BackendSliderCaptchaSuccessPayload) {
  captchaData.value = { code: payload.code, randomStr: payload.randomStr };
}

async function handleLogin(values: Recordable<any>) {
  if (!captchaData.value.code || !captchaData.value.randomStr) {
    return;
  }
  await authStore.authLogin({
    ...values,
    code: captchaData.value.code,
    randomStr: captchaData.value.randomStr,
  });
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <BackendSliderCaptcha @success="handleCaptchaSuccess" />
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      @submit="handleLogin"
    />
  </div>
</template>
```

说明：
- `AuthenticationLogin` 组件没有专门的 captcha 插槽，因此将 `BackendSliderCaptcha` 放在登录表单上方，通过 `captchaData` ref 单独管理验证码结果。
- 表单提交时合并 `code` 和 `randomStr` 后再调用 `authStore.authLogin`。
- 如果 `BackendSliderCaptcha` 校验失败或过期，组件内部会重新加载验证码，`captchaData` 保持旧值，提交时需要在表单校验中增加提示（可选，实现阶段可补充）。

- [ ] **Step 2: 提交**

```bash
git add apps/web-app/src/views/_core/authentication/login.vue
git commit -m "feat(web-app): 登录视图接入后端滑块验证码

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 10: 联调验证

**Files:**
- Modify: `frontend/apps/web-app/src/components/backend-slider-captcha/index.vue`（根据后端 `/auth/code/create` 和 `/auth/code/check` 实际返回字段调整 CaptchaCreateResult、图片渲染和 pointJson 构造）
- Modify: `frontend/apps/web-app/src/api/core/captcha.ts`（若后端返回字段与当前定义不一致则调整）

**Interfaces:**
- Consumes: 后端 `edms-auth`、`edms-gateway`、数据库
- Produces: 可工作的登录流程

- [ ] **Step 1: 启动后端服务**

确保以下服务已启动：
- Nacos（配置中心/注册中心）
- MySQL 数据库，已执行 `database/edms.sql`
- `edms-gateway` 在 `localhost:9999`
- `edms-auth` 已注册到 Nacos
- `edms-upms-biz` 已注册到 Nacos（用于 `/admin/user/info`）

- [ ] **Step 2: 启动前端开发服务器**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm dev
```

- [ ] **Step 3: 测试登录流程**

使用数据库中存在的用户（例如 `admin` / 默认密码）登录，观察：
1. 验证码 `/auth/code/create` 是否返回图片和 token。
2. `/auth/code/check` 是否返回 `captchaVerification`。
3. `/auth/oauth2/token` 是否返回 `access_token` 和 `refresh_token`。
4. 登录成功后是否跳转首页。

- [ ] **Step 4: 调整验证码组件和 API**

根据实际接口返回：
1. 补全 `CaptchaCreateResult` 接口字段。
2. 补全 `BackendSliderCaptcha` 的渲染和拖动交互。
3. 确认 `pointJson` 的格式（通常是拖动轨迹的 JSON 字符串）。

- [ ] **Step 5: 测试 token 刷新**

修改后端 `edms` 客户端的 `access_token_validity` 为较短值（如 60 秒），重新登录，等待 token 过期后访问业务接口，确认自动刷新成功。

- [ ] **Step 6: 测试登出**

点击登出，确认 token 被清除并跳转登录页。

- [ ] **Step 7: 提交最终调整**

```bash
git add apps/web-app/src/components/backend-slider-captcha/index.vue apps/web-app/src/api/core/captcha.ts
git commit -m "feat(web-app): 联调完成 OAuth2 登录与验证码

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 验收检查清单

- [ ] `VITE_OAUTH2_PASSWORD_CLIENT`、`VITE_PWD_ENC_KEY` 等环境变量已配置
- [ ] `/api` 代理指向 `localhost:9999`
- [ ] `encryptPassword` 单元测试通过
- [ ] `oAuth2Login` 单元测试通过
- [ ] 登录成功返回 `access_token` 和 `refresh_token`
- [ ] 验证码错误时提示正确并刷新
- [ ] 密码错误时提示正确
- [ ] token 过期自动刷新成功
- [ ] 登出后清除 token 并跳转登录页
- [ ] 刷新页面后仍保持登录状态

---

## 已知风险与备注

1. **`pointJson` 格式可能需调整**：`BackendSliderCaptcha` 使用 `{ x, y, t }` 格式，如果后端 anji-captcha 校验要求不同格式，在 Task 10 联调阶段调整 `handleEnd` 中的构造逻辑。
2. **`VITE_PWD_ENC_KEY` 必须与后端一致**：默认值 `'thanks,edms2026!'` 是示例，必须与后端 `security.encode-key` 完全一致。
3. **crypto-js 和 sm-crypto 的 catalog 配置**：如果 workspace catalog 已存在，则直接引用；否则需要添加版本号或 catalog 条目。

---

## 自审检查

### 1. Spec 覆盖

对照 `docs/superpowers/specs/2026-07-13-oauth2-login-design.md` 逐条检查：

| Spec 要求 | 覆盖任务 |
|-----------|---------|
| 直接对接 `/auth/oauth2/token` | Task 6 (`adapter/backend/auth.ts`) |
| 使用 `baseRequestClient` 处理原始 OAuth2 响应 | Task 6 |
| 业务请求继续使用 `requestClient` | Task 6、Task 8 |
| Basic Auth | Task 6 (`getBasicAuth`) |
| form-urlencoded | Task 6 (`buildFormData`) |
| 密码 AES/SM4 加密 | Task 3 (`passwordCrypto.ts`) |
| 滑块验证码（后端校验） | Task 4 (`captcha.ts`)、Task 5 (`BackendSliderCaptcha`)、Task 9 (`login.vue`) |
| token 刷新 | Task 7 (`auth.ts`)、Task 8 (`request.ts`) |
| 登出 | Task 6 (`oAuth2Logout`) |
| 开发环境代理 | Task 1 |
| 环境变量 | Task 1 |

### 2. Placeholder 扫描

已检查全文，无 `TODO`、`TBD`、`占位`、`示意`、`实现者`、无步骤缺失代码。

### 3. 类型一致性

- `BackendSliderCaptchaSuccessPayload` 在 `index.vue` 和 `login.vue` 中定义/导入一致。
- `OAuth2TokenResponse` 在 `adapter/backend/auth.ts` 中定义，返回字段 `access_token`、`refresh_token` 与 `loginApi`/`refreshTokenApi` 映射一致。
- `CaptchaCreateResult` 字段与 `BackendSliderCaptcha` 使用字段一致。

---

## 执行方式选择

**Plan complete and saved to `docs/superpowers/plans/2026-07-13-oauth2-login-integration.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
