export const ADSENSE_CLIENT_ID = 'ca-pub-3092860263793092';

export const adsConfig = {
  clientId: process.env.NEXT_PUBLIC_ADS_CLIENT_ID || ADSENSE_CLIENT_ID,
  topSlotId: process.env.NEXT_PUBLIC_ADS_TOP_SLOT_ID || '',
  bottomSlotId: process.env.NEXT_PUBLIC_ADS_BOTTOM_SLOT_ID || '',
  sideSlotId: process.env.NEXT_PUBLIC_ADS_SIDE_SLOT_ID || '',
  modalSlotId: process.env.NEXT_PUBLIC_ADS_MODAL_SLOT_ID || '',
  enabled: true,
};

export function hasAdSlot(slotId: string) {
  return adsConfig.enabled && adsConfig.clientId.length > 0 && slotId.length > 0;
}
