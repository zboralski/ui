export const workflowCancelEnabled = (settings: Settings): boolean => {
  return !settings.disableWriteActions && !settings.workflowCancelDisabled;
};
