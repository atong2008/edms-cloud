import {
  appCopyrightPreferences,
  defineOverridesPreferences,
  definePreferencesExtension,
} from '@vben/preferences';

interface WebAppPreferencesExtension {
  defaultTableSize: number;
  enableFormFullscreen: boolean;
  reportTitle: string;
  tenantMode: 'multi' | 'single';
}

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    enableCheckUpdates: false,
    layout: 'header-nav',
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: appCopyrightPreferences,
  navigation: {
    styleType: 'plain',
  },
  tabbar: {
    wheelable: false,
  },
  theme: {
    mode: 'light',
    radius: '0.25',
  },
  transition: {
    name: 'fade',
  },
  widget: {
    fullscreen: false,
    globalSearch: false,
    lockScreen: false,
    sidebarToggle: false,
    timezone: false,
  },
});

export const preferencesExtension =
  definePreferencesExtension<WebAppPreferencesExtension>({
    tabLabel: 'preferences.edms.tabLabel',
    title: 'preferences.edms.title',
    fields: [
      {
        component: 'switch',
        defaultValue: true,
        key: 'enableFormFullscreen',
        label: 'preferences.edms.fields.enableFormFullscreen.label',
        tip: 'preferences.edms.fields.enableFormFullscreen.tip',
      },
      {
        component: 'select',
        defaultValue: 'multi',
        key: 'tenantMode',
        label: 'preferences.edms.fields.tenantMode.label',
        options: [
          {
            label: 'preferences.edms.fields.tenantMode.options.single.label',
            value: 'single',
          },
          {
            label: 'preferences.edms.fields.tenantMode.options.multi.label',
            value: 'multi',
          },
        ],
      },
      {
        component: 'number',
        componentProps: {
          max: 200,
          min: 10,
          step: 10,
        },
        defaultValue: 20,
        key: 'defaultTableSize',
        label: 'preferences.edms.fields.defaultTableSize.label',
      },
      {
        component: 'input',
        defaultValue: '',
        key: 'reportTitle',
        label: 'preferences.edms.fields.reportTitle.label',
        placeholder: 'preferences.edms.fields.reportTitle.placeholder',
      },
    ],
  });
