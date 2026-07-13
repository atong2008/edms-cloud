# OAuth2 登录认证前后端对接设计

**日期**：2026-07-13  
**主题**：前端 `apps/web-app` 与后端 `edms-auth` 的登录认证对接  
**范围**：第一阶段仅完成用户名密码登录、Token 刷新、登出、用户信息获取。

---

## 1. 背景与现状

### 1.1 后端现状

- `edms-auth` 模块基于 Spring Authorization Server 搭建，是项目认证中心。
- 已支持 OAuth2 密码模式（`grant_type=password`）、刷新模式（`grant_type=refresh_token`）、短信模式等。
- 网关 `edms-gateway` 将 `/auth/**` 路由到 `edms-auth`。
- 数据库 `sys_oauth_client_details` 已注册 `edms` 客户端：
  - `client_id`: `edms`
  - `scope`: `server`
  - `grant_types`: `password,refresh_token,authorization_code,mobile`
  - `additional_information`: `{"enc_flag":"1","captcha_flag":"1","online_quantity":"1"}`
- 登录接口实际暴露路径：`POST /auth/oauth2/token`。

### 1.2 前端现状

- `apps/web-app` 基于 Vben Admin Pro 5.7.0（Vue 3 + Vite + Pinia）。
- 当前 `src/api/core/auth.ts` 期望调用 `/auth/login`、`/auth/refresh`、`/auth/logout`。
- 当前登录视图使用 `<SliderCaptcha>` 纯前端滑块验证。
- `src/api/request.ts` 已使用 `@vben/request` 的 `RequestClient`，具备 token 过期自动刷新拦截器。
- 项目契约文档 `docs/shared/auth-contract.md` 已约定：
  - Token 端点：`POST /auth/oauth2/token`
  - 前端实现位置：`apps/web-app/src/adapter/backend/auth.ts`
  - 业务 API 使用 `requestClient` + `Authorization: Bearer {token}`

### 1.3 核心问题

- 前后端登录协议未对齐：前端期望 `/auth/login`，后端实际为 `/auth/oauth2/token`。
- 前端密码未加密，后端 `PasswordDecoderFilter` 要求 `edms` 客户端必须密文传输。
- 前端滑块验证码为纯前端验证，不满足后端 `ValidateCodeFilter` 对行为验证码的校验要求。

---

## 2. 设计目标

1. 前端直接对接后端 OAuth2 密码模式登录接口 `/auth/oauth2/token`。
2. 支持密码 AES/SM4 加密传输。
3. 支持后端行为验证码（blockPuzzle 滑块）校验。
4. 复用 `@vben/request` 的 token 刷新和错误处理机制。
5. 保持登录成功后获取用户信息、权限码、跳转首页的现有流程不变。

### 非目标

- 不实现短信登录、社交登录、注册、忘记密码（后续阶段处理）。
- 不改造后端认证中心逻辑（仅可能调整 `edms` 客户端配置）。
- 不对业务请求做全局参数/响应加密（仅登录密码加密）。

---

## 3. 架构与文件结构

### 3.1 新增/修改文件

```
frontend/apps/web-app/
├── .env                          # 新增 OAuth2 客户端、加密密钥等环境变量
├── .env.development              # 开发环境覆盖
├── vite.config.ts                # 开发代理 /api → 网关
├── src/
│   ├── adapter/
│   │   └── backend/
│   │       └── auth.ts           # 新增：OAuth2 适配器（核心）
│   ├── api/
│   │   ├── core/
│   │   │   ├── auth.ts           # 修改：薄封装，内部调用 adapter
│   │   │   └── captcha.ts        # 新增：验证码接口
│   │   └── request.ts            # 修改：refreshToken 调用 adapter
│   ├── utils/
│   │   └── passwordCrypto.ts     # 新增：AES/SM4 密码加密
│   ├── components/
│   │   └── backend-slider-captcha/  # 新增：后端校验滑块验证码组件（放在 apps/web-app/src/components 下）
│   └── views/_core/authentication/
│       └── login.vue             # 修改：接入后端滑块验证码
```

### 3.2 客户端划分

| 客户端 | 用途 | 原因 |
|--------|------|------|
| `baseRequestClient` | OAuth2 token 请求、登出、校验 token | 不经过默认的 `{ code, data }` 响应拦截器，直接拿原始响应 |
| `requestClient` | 业务 API（`/admin/**` 等） | 自动处理统一响应格式、错误提示、token 过期刷新 |

---

## 4. OAuth2 适配器设计

### 4.1 文件：`src/adapter/backend/auth.ts`

职责：封装所有与后端 OAuth2 的 token 相关网络请求和响应解析。不处理业务状态（token 存储、路由跳转由 store 负责）。

```typescript
// 核心接口定义（伪代码）
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface TokenCheckResult {
  // 后端 /auth/token/check_token 实际返回结构，联调时确认
  active: boolean;
  exp?: number;
  [key: string]: any;
}

export interface LoginParams {
  username: string;
  password: string;      // 明文，由 adapter 内部加密
  randomStr: string;     // 验证码 key，例如 'blockPuzzle'
  code: string;          // 验证码校验串
  grant_type?: string;   // 默认 'password'
  scope?: string;        // 默认 'server'
}

export async function oAuth2Login(params: LoginParams): Promise<OAuth2TokenResponse>
export async function oAuth2RefreshToken(refreshToken: string): Promise<OAuth2TokenResponse>
export async function oAuth2Logout(): Promise<void>
export async function oAuth2CheckToken(token: string): Promise<TokenCheckResult>
```

### 4.2 实现要点

1. **使用 `baseRequestClient`**：OAuth2 返回标准 JSON，不包 `{ code: 0, data: ... }`，因此不能用带默认拦截器的 `requestClient`。
2. **Content-Type**：`application/x-www-form-urlencoded`。
3. **Basic Auth**：`Authorization: Basic ${btoa(clientId + ':' + clientSecret)}`。
   - 客户端信息来自 `.env`：`VITE_OAUTH2_PASSWORD_CLIENT='edms:'`（secret 为空）。
   - 后端 `AuthUtils.extractAndDecodeHeader` 要求 `Basic base64(clientId:clientSecret)` 格式。
4. **密码加密**：调用 `src/utils/passwordCrypto.ts` 对 `password` 加密。
5. **参数序列化**：使用 `URLSearchParams` 或 `qs` 将参数转成 form 格式。

### 4.3 数据流：登录

```
login.vue
  ↓ 收集 username/password，并传入 randomStr/code（由后端滑块验证码组件提供）
authStore.authLogin(params)
  ↓ 调用
loginApi(params)  [api/core/auth.ts]
  ↓ 调用
oAuth2Login(params)  [adapter/backend/auth.ts]
  ↓ 加密 password
  ↓
POST /auth/oauth2/token
  ← 返回 { access_token, refresh_token, expires_in, token_type }
  ↓
loginApi 返回 { accessToken, refreshToken }
  ↓
authStore 存储 accessToken 到 accessStore
  ↓
获取用户信息（/admin/user/info） + 权限码（/auth/codes）
  ↓
跳转首页
```

### 4.4 数据流：Token 刷新

```
requestClient 请求业务 API
  ↓ 收到 401 / token 过期
authenticateResponseInterceptor 触发
  ↓
doRefreshToken()
  ↓
refreshTokenApi()  [api/core/auth.ts]
  ↓
oAuth2RefreshToken(refreshToken)
  ↓
POST /auth/oauth2/token (grant_type=refresh_token)
  ← 返回新的 access_token
  ↓
accessStore.setAccessToken(newToken)
accessStore.setRefreshToken(newRefreshToken)  // 若后端返回新的 refresh_token
  ↓
重放原请求
```

---

## 5. 请求客户端与 Token 生命周期

### 5.1 修改 `src/api/request.ts`

当前 `refreshTokenApi` 是从 `api/core` 导入的。需要改成调用 adapter：

```typescript
import { oAuth2RefreshToken } from '#/adapter/backend/auth';

async function doRefreshToken() {
  const accessStore = useAccessStore();
  const refreshToken = accessStore.refreshToken;
  const resp = await oAuth2RefreshToken(refreshToken);
  const newToken = resp.access_token;
  accessStore.setAccessToken(newToken);
  if (resp.refresh_token) {
    accessStore.setRefreshToken(resp.refresh_token);
  }
  return newToken;
}
```

### 5.2 Token 存储

- `accessToken` 和 `refreshToken` 都存储在 `useAccessStore`（来自 `@vben/stores`），该 store 已提供 `setAccessToken` 和 `setRefreshToken`。
- 注意：避免将 token 明文写入日志或 URL。

### 5.3 开发环境代理

将 `vite.config.ts` 中 `/api` 代理目标从 `localhost:5320`（mock）改为 `localhost:9999`（网关）：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:9999',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      ws: true,
    },
  },
}
```

这样前端请求 `/api/auth/oauth2/token` 会被转发到 `http://localhost:9999/auth/oauth2/token`。

### 5.4 环境变量

在 `apps/web-app/.env` 和 `.env.development` 中新增：

```bash
VITE_OAUTH2_PASSWORD_CLIENT='edms:'
VITE_OAUTH2_MOBILE_CLIENT='app:app'
VITE_OAUTH2_SOCIAL_CLIENT='social:social'
VITE_PWD_ENC_KEY='your-16-byte-key'  # 与后端 security.encode-key 一致
VITE_PWD_ENC_TYPE='AES'              # 或 SM4
```

---

## 6. 验证码设计

### 6.1 方案选择

采用**后端校验的滑块行为验证码**（blockPuzzle），替代当前纯前端的 `<SliderCaptcha>`。

### 6.2 原因

- 后端 `edms` 客户端 `captcha_flag='1'`，必须校验验证码。
- 当前 Vben `<SliderCaptcha>` 仅做客户端验证，无法通过 `ValidateCodeFilter`。
- 后端已支持 anji-captcha 的 blockPuzzle/clickWord/math 类型，滑块验证码用户体验较好。

### 6.3 验证码流程

```
1. 打开登录页
   ↓
2. 调用 GET /auth/code/create?captchaType=blockPuzzle
   ← 返回 { backgroundImage, sliderImage, token, ... }
   ↓
3. 渲染滑块验证码图片
   ↓
4. 用户拖动滑块到缺口位置
   ↓
5. 前端根据移动距离生成 pointJson
   ↓
6. 调用 POST /auth/code/check
      body: { token, pointJson, captchaType: 'blockPuzzle' }
   ← 返回 { data: '<captchaVerification>' }
   ↓
7. 登录表单携带：
      randomStr: 'blockPuzzle'
      code: '<captchaVerification>'
   ↓
8. 后端 ValidateCodeFilter 用 blockPuzzle + captchaVerification 校验
```

### 6.4 新增组件

新增 `BackendSliderCaptcha` 组件，职责：

| 职责 | 说明 |
|------|------|
| 获取验证码 | 调用 `GET /auth/code/create` |
| 渲染 | 展示后端返回的 backgroundImage + sliderImage |
| 校验 | 拖动结束后调用 `POST /auth/code/check` |
| 输出 | 成功后 emit `{ randomStr: 'blockPuzzle', code: captchaVerification }` |

### 6.5 新增 Captcha API

新增 `src/api/core/captcha.ts`：

```typescript
export interface CaptchaCreateResult {
  backgroundImage: string;
  sliderImage: string;
  token: string;
  // 其他字段根据后端实际返回调整
}

export async function createBehaviorCaptcha(captchaType: string): Promise<CaptchaCreateResult>
export async function checkBehaviorCaptcha(params: {
  token: string;
  pointJson: string;
  captchaType: string;
}): Promise<string> // 返回 captchaVerification
```

### 6.6 登录视图修改

`login.vue` 中：

- 移除当前 `<SliderCaptcha>` 的表单字段和验证规则。
- 添加 `<BackendSliderCaptcha>` 组件。
- 当 captcha 校验成功后，将 `randomStr` 和 `code` 注入表单值。
- 表单提交时把这些字段一起传给 `authStore.authLogin`。

### 6.7 登录参数最终形态

```typescript
{
  username: string;
  password: string;          // AES/SM4 加密后
  grant_type: 'password';
  scope: 'server';
  randomStr: 'blockPuzzle';  // 来自后端滑块验证码
  code: string;               // 来自 /auth/code/check 的 captchaVerification
}
```

---

## 7. 密码加密

### 7.1 需求

后端 `PasswordDecoderFilter` 对 `edms` 客户端（`enc_flag='1'`）的登录请求密码进行解密。前端必须加密。

### 7.2 算法

| 类型 | 后端逻辑 | 前端对应实现 |
|------|---------|-------------|
| AES | CFB 模式、NoPadding、IV = 密钥 | `crypto-js` 或 `aes-js` |
| SM4 | 密钥为 32 位 HEX | `sm-crypto` |

### 7.3 实现

新增 `src/utils/passwordCrypto.ts`：

```typescript
export function encryptPassword(password: string): string
```

- 读取 `VITE_PWD_ENC_TYPE`（默认 AES）和 `VITE_PWD_ENC_KEY`。
- AES 密钥必须是 16 字节 UTF-8 字符串。
- SM4 密钥必须是 32 位 HEX 字符串。
- 刷新 token 时不需加密 password。

---

## 8. 错误处理与边界情况

### 8.1 登录失败

后端 OAuth2 错误返回标准格式：

```json
{
  "error": "invalid_grant",
  "error_description": "用户名或密码错误"
}
```

前端处理：

- 适配器层统一包装为 `{ code: error, message: error_description }`。
- `authStore.authLogin` catch 后通过 `message.error` 显示。

常见错误映射：

- `invalid_grant` → 用户名或密码错误
- `invalid_request` → 请求参数缺失
- `invalid_client` → 客户端信息错误
- 验证码错误 → 重新加载验证码

### 8.2 Token 过期与刷新

- `requestClient` 的 `authenticateResponseInterceptor` 自动触发 `doRefreshToken`。
- 刷新成功后更新 accessStore 并重放原请求。
- 刷新失败（refresh token 过期）→ `doReAuthenticate` 清除 token 并跳转登录页。
- `@vben/request` 已处理并发刷新，无需额外加锁。

### 8.3 浏览器刷新/多标签页

- 如果 `useAccessStore` 使用持久化存储，刷新页面后仍保持登录。
- 多标签页共享持久化状态。
- 注意：不要持久化 password、refresh_token 等敏感信息到非安全存储。

### 8.4 开发环境常见问题

- `invalid_client`：检查 `VITE_OAUTH2_PASSWORD_CLIENT` 是否匹配数据库 `client_id`。
- 密码解密失败：检查 `VITE_PWD_ENC_KEY` 与后端 `security.encode-key` 是否一致，长度是否正确。
- 验证码失败：检查 `/auth/code/create` 和 `/auth/code/check` 是否走通代理，字段格式是否正确。

---

## 9. 测试计划

### 9.1 单元测试（可选）

- `passwordCrypto.ts`：AES 加密输出非空、密钥长度校验、SM4 密钥格式校验。

### 9.2 联调测试（必做）

| 场景 | 预期结果 |
|------|---------|
| 正确用户名密码 + 验证码 | 登录成功，跳转首页，accessStore 有 token |
| 错误密码 | 提示用户名或密码错误 |
| 错误验证码 | 提示验证码错误，重新加载验证码 |
| token 过期 | 自动刷新 token，业务请求继续成功 |
| refresh token 过期 | 跳转登录页 |
| 登出 | 清除 token，跳转登录页 |

### 9.3 验收标准

- [ ] 用户名密码登录成功
- [ ] 验证码错误时给出明确提示
- [ ] token 自动刷新无感
- [ ] 登出后无法访问受保护页面
- [ ] 刷新页面后仍保持登录状态（若 accessStore 持久化）

---

## 10. 风险与待确认事项

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 滑块验证码组件实现成本 | 需要实现或引入能与后端 anji-captcha 对接的组件 | 先确认是否有现成 Vue 组件；如无，手写轻量组件 |
| `/auth/code/check` 字段格式 | 实际返回字段需与后端联调确认 | 开发阶段先抓包确认 captchaVerification 格式 |
| `useAccessStore` 无 refreshToken | 需扩展 store | 在实现计划中明确 |
| 后端 CORS | 开发环境可能遇到跨域 | 使用 Vite 代理，必要时后端配置 CORS |
| OAuth2 password 模式已废弃 | 行业层面不推荐，但后端已采用 | 项目当前阶段接受；后续可考虑 PKCE 授权码模式 |

---

## 11. 参考

- 后端 `edms-auth`：Spring Authorization Server、OAuth2ResourceOwnerPasswordAuthenticationProvider、PasswordDecoderFilter、ValidateCodeFilter、AuthCaptchaSupport。
- 前端 `@vben/request`：RequestClient、authenticateResponseInterceptor。
- 参考项目：`pig-ui` 的 `src/api/login/index.ts`（OAuth2 密码模式实现）。
- 项目契约：`docs/shared/auth-contract.md`。
