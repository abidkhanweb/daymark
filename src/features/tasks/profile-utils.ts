const DEMO_NICKNAME = 'alex001';

export const canUseDemoMode = (nickname: string) => nickname.trim().toLocaleLowerCase() === DEMO_NICKNAME;

export const profileGreetingName = (name: string, nickname: string) => canUseDemoMode(nickname) ? name.trim() : nickname.trim() || name.trim();
