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
    const data = response.data as CaptchaCreateResult;
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
