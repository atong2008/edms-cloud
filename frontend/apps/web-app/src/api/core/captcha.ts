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
