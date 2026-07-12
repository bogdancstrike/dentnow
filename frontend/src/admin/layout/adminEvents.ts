export const COMMAND_PALETTE_EVENT = 'dentnow:cmdk-open';

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
}
