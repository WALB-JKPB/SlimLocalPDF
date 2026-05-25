/** UI zone identifiers for layout and testing */
export const ZONES = {
  CURRENT_FILE_INFO: 'current-file-info',
  PRESET: 'preset',
  UPLOAD_FILE: 'upload-file',
  PRESIZE_CONTROL: 'presize-control',
  SUBMIT: 'submit',
} as const;

export type ZoneId = (typeof ZONES)[keyof typeof ZONES];
