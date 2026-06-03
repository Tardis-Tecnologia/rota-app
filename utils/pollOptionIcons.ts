/** Ícones rotativos para opções de enquete (estilo opção B do mural). */
export const POLL_OPTION_ICON_NAMES = [
  'trash-outline',
  'bulb-outline',
  'construct-outline',
  'leaf-outline',
  'water-outline',
  'bus-outline',
  'medkit-outline',
  'school-outline',
] as const;

export function pollOptionIconName(index: number): (typeof POLL_OPTION_ICON_NAMES)[number] {
  return POLL_OPTION_ICON_NAMES[index % POLL_OPTION_ICON_NAMES.length];
}
