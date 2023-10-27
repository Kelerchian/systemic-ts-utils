export const sleep = (dur: number) =>
  new Promise((res) => setTimeout(res, dur));
