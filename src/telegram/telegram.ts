export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type TelegramWebAppInitDataUnsafe = {
  user?: TelegramWebAppUser;
};

export type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: TelegramWebAppInitDataUnsafe;
  platform?: string;
  version?: string;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  openLink?: (url: string) => void;
  showScanQrPopup?: (
    params: { text?: string },
    callback?: (text: string) => boolean | void,
  ) => void;
  isVersionAtLeast?: (ver: string) => boolean;
};

export type TelegramGlobal = {
  WebApp?: TelegramWebApp;
};
