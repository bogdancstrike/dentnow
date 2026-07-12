import type { ThemeConfig } from 'antd';

/** Global + component tokens only — no `.ant-*` DOM overrides anywhere in the admin. */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0ea5a4',
    borderRadius: 8,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  components: {
    Layout: { headerBg: '#0f172a', siderBg: '#0f172a' },
    Menu: { darkItemBg: '#0f172a' },
  },
};
