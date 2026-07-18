export const DESIGN_TOKENS = {
  colors: {
    bgObsidian: 'hsl(220, 15%, 5%)',
    bgDeep: 'hsl(220, 15%, 8%)',
    accentPrimary: 'hsl(250, 85%, 62%)',
    colorSuccess: 'hsl(150, 80%, 40%)',
    colorWarning: 'hsl(38, 90%, 50%)',
    colorDanger: 'hsl(355, 85%, 55%)'
  }
};

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
