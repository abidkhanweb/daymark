export const profileGreetingName = (name: string, nickname: string) => nickname.trim() || name.trim();

export const canUseDemoMode = (nickname: string) => nickname.trim().toLocaleLowerCase() === 'alex001';
