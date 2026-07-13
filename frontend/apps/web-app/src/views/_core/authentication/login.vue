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
