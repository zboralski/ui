<script lang="ts">
  import { page } from '$app/stores';
  import {
    resetWorkflow,
    signalWorkflow,
    terminateWorkflow,
  } from '$lib/services/workflow-service';

  import { writeActionsAreAllowed } from '$lib/utilities/write-actions-are-allowed';
  import { ResetType } from '$lib/models/workflow-actions';

  import { refresh } from '$lib/stores/workflow-run';
  import { settings } from '$lib/stores/settings';
  import { coreUserStore } from '$lib/stores/core-user';
  import { cancelWorkflow } from '$lib/services/workflow-service';
  import { toaster } from '$lib/stores/toaster';

  import SplitButton from '$lib/holocene/split-button.svelte';
  import MenuItem from '$lib/holocene/primitives/menu/menu-item.svelte';
  import Modal from '$lib/holocene/modal.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import MenuDivider from '$lib/holocene/primitives/menu/menu-divider.svelte';
  import JSONEditor from '$lib/holocene/json-editor.svelte';
  import { eventHistory } from '$lib/stores/events';
  import { getFirstResetEventID } from '$lib/utilities/get-first-reset-event-id';
  import { resetWorkflows } from '$lib/stores/reset-workflows';
  import WorkflowResetForm from '$lib/components/workflow/workflow-reset-form.svelte';
  import { workflowCancelEnabled } from '$lib/utilities/workflow-cancel-enabled';
  import { workflowSignalEnabled } from '$lib/utilities/workflow-signal-enabled';
  import { workflowTerminateEnabled } from '$lib/utilities/workflow-terminate-enabled';
  import { workflowResetEnabled } from '$lib/utilities/workflow-reset-enabled';

  export let workflow: WorkflowExecution;
  export let namespace: string;
  export let cancelInProgress: boolean;

  let reason = '';
  let signalInput = '';
  let signalName = '';
  let cancelConfirmationModal: Modal;
  let terminateConfirmationModal: Modal;
  let resetConfirmationModal: Modal;
  let signalConfirmationModal: Modal;
  let resetType: ResetType = ResetType.FirstWorkflowTask;
  let resetId: string | undefined = undefined;
  let resetReason: string | undefined = undefined;
  let eventIdValid: boolean = true;
  let loading = false;

  $: cancelEnabled = workflowCancelEnabled($page.data.settings);
  $: signalEnabled = workflowSignalEnabled($page.data.settings);
  $: terminateEnabled = workflowTerminateEnabled($page.data.settings);
  $: resetEnabled = workflowResetEnabled($page.data.settings);

  const hideTerminationModal = () => {
    reason = '';
  };

  const hideSignalModal = () => {
    signalInput = '';
    signalName = '';
  };

  const hideResetModal = () => {
    resetType = ResetType.FirstWorkflowTask;
    resetId = undefined;
    resetReason = undefined;
    eventIdValid = true;
  };

  const handleSuccessfulTermination = async () => {
    terminateConfirmationModal.close();
    $refresh = Date.now();
    toaster.push({
      id: 'workflow-termination-success-toast',
      message: 'Workflow terminated.',
    });
  };

  const handleTerminationError = (error: NetworkError) => {
    reason = '';
    terminateConfirmationModal.setError(
      error?.message ?? 'An unknown error occurred.',
    );
  };

  const terminate = () => {
    if (!workflow.canBeTerminated) return;
    terminateWorkflow({
      workflow,
      namespace,
      reason,
    })
      .then(handleSuccessfulTermination)
      .catch(handleTerminationError);
  };

  const cancel = async () => {
    loading = true;
    try {
      await cancelWorkflow({
        namespace,
        workflowId: workflow.id,
        runId: workflow.runId,
      });
      cancelConfirmationModal.close();
      loading = false;
      $refresh = Date.now();
      toaster.push({
        id: 'workflow-cancelation-success-toast',
        message: 'Workflow canceled.',
      });
    } catch (error) {
      cancelConfirmationModal.setError(
        error?.message ?? 'An unknown error occurred.',
      );
    }
  };

  const handleSignalInputChange = (event: CustomEvent<string>) => {
    signalInput = event.detail;
  };

  const signal = async () => {
    try {
      await signalWorkflow({
        namespace,
        workflowId: workflow.id,
        runId: workflow.runId,
        signalInput,
        signalName,
      });
      signalConfirmationModal.close();
      $refresh = Date.now();
      toaster.push({
        message: 'Workflow signaled.',
        id: 'workflow-signal-success-toast',
      });
    } catch (error) {
      signalConfirmationModal.setError(
        error?.message ?? 'An unknown error occurred.',
      );
    }

    hideSignalModal();
  };

  const reset = async () => {
    switch (resetType) {
      case ResetType.FirstWorkflowTask:
        resetId = getFirstResetEventID($eventHistory.start);
        break;
      case ResetType.LastWorkflowTask: {
        resetId = getFirstResetEventID($eventHistory.end);
        break;
      }
    }

    try {
      const response = await resetWorkflow({
        namespace,
        workflowId: workflow.id,
        runId: workflow.runId,
        eventId: resetId,
        reason: resetReason,
      });

      if (response && response.runId) {
        resetWorkflows.update((previous) => ({
          ...previous,
          [workflow.runId]: response.runId,
        }));
      }
      resetConfirmationModal.close();
      $refresh = Date.now();
    } catch (error) {
      resetConfirmationModal.setError(
        error?.message ?? 'An unknown error occurred.',
      );
    }
    hideResetModal();
  };

  let workflowActions: {
    label: string;
    onClick: () => void;
    allowed: boolean;
    testId: string;
    destructive?: boolean;
    tooltip?: string;
  }[];

  const resetTooltipText = (): string | undefined => {
    if (!resetEnabled)
      return 'Resetting workflows is not enabled, please contact your administrator for assistance.';
    if (resetEnabled && workflow?.pendingChildren?.length > 0)
      return 'Cannot reset workflows with pending children.';
  };

  $: workflowActions = [
    {
      label: 'Reset',
      onClick: () => resetConfirmationModal.open(),
      testId: 'reset-button',
      allowed: resetEnabled && workflow?.pendingChildren?.length === 0,
      tooltip: resetTooltipText(),
    },
    {
      label: 'Send a Signal',
      onClick: () => signalConfirmationModal.open(),
      testId: 'signal-button',
      allowed: signalEnabled,
      tooltip: signalEnabled
        ? ''
        : 'Signaling workflows is not enabled, please contact your administrator for assistance.',
    },
    {
      label: 'Terminate',
      onClick: () => terminateConfirmationModal.open(),
      testId: 'terminate-button',
      allowed: terminateEnabled,
      destructive: true,
      tooltip: terminateEnabled
        ? ''
        : 'Terminating workflows is not enabled, please contact your adminstrator for assistance.',
    },
  ];

  let coreUser = coreUserStore();

  $: actionsDisabled =
    $coreUser.namespaceWriteDisabled(namespace) ||
    !writeActionsAreAllowed(settings);
</script>

<SplitButton
  id="workflow-actions"
  position="right"
  disabled={actionsDisabled}
  primaryActionDisabled={!cancelEnabled || cancelInProgress}
  on:click={() => cancelConfirmationModal.open()}
  label="Request Cancellation"
>
  {#each workflowActions as { onClick, destructive, label, allowed, testId, tooltip }}
    {#if destructive}
      <MenuDivider />
    {/if}
    <MenuItem
      on:click={onClick}
      {destructive}
      {testId}
      disabled={!allowed}
      tooltipProps={{ text: tooltip, left: true, width: 200 }}
    >
      {label}
    </MenuItem>
  {/each}
</SplitButton>

<Modal
  data-testid="reset-confirmation-modal"
  bind:this={resetConfirmationModal}
  on:confirmModal={reset}
  on:cancelModal={hideResetModal}
  confirmDisabled={resetType === ResetType.EventId && !eventIdValid}
>
  <h3 slot="title">Reset Workflow</h3>
  <svelte:fragment slot="content">
    <WorkflowResetForm
      bind:eventId={resetId}
      bind:eventIdValid
      bind:resetType
      bind:reason={resetReason}
      lastEvent={$eventHistory.end[0]}
    />
  </svelte:fragment>
</Modal>
<Modal
  data-testid="cancel-confirmation-modal"
  bind:this={cancelConfirmationModal}
  {loading}
  confirmType="destructive"
  on:confirmModal={cancel}
>
  <h3 slot="title">Cancel Workflow</h3>
  <svelte:fragment slot="content">
    <p>
      Are you sure you want to cancel this workflow? This action cannot be
      undone.
    </p>
  </svelte:fragment>
</Modal>
<Modal
  data-testid="terminate-confirmation-modal"
  bind:this={terminateConfirmationModal}
  confirmText="Terminate"
  confirmType="destructive"
  on:cancelModal={hideTerminationModal}
  on:confirmModal={terminate}
>
  <h3 slot="title">Terminate Workflow</h3>
  <div slot="content">
    <p>
      Are you sure you want to terminate this workflow? This action cannot be
      undone.
    </p>
    <Input
      id="workflow-termination-reason"
      class="mt-4"
      placeholder="Enter a reason"
      bind:value={reason}
    />
  </div>
</Modal>
<Modal
  data-testid="signal-confirmation-modal"
  bind:this={signalConfirmationModal}
  confirmText="Submit"
  confirmDisabled={!signalName}
  on:cancelModal={hideSignalModal}
  on:confirmModal={signal}
>
  <h3 slot="title">Send a Signal</h3>
  <div slot="content" class="flex flex-col gap-4">
    <Input
      id="signal-name"
      label="Signal name"
      required
      bind:value={signalName}
    />
    <div>
      <span class="font-secondary text-sm font-medium">Input</span>
      <span class="font-secondary text-xs font-light italic">
        (only JSON payloads are supported)
      </span>
      <JSONEditor
        class="max-h-80 overflow-y-scroll overscroll-contain"
        value={signalInput}
        on:change={handleSignalInputChange}
      />
    </div>
  </div>
</Modal>
