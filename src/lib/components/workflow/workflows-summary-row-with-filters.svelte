<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher } from 'svelte';

  import { formatDate } from '$lib/utilities/format-date';
  import { getMilliseconds } from '$lib/utilities/format-time';
  import { routeForEventHistory } from '$lib/utilities/route-for';

  import WorkflowStatus from '$lib/components/workflow-status.svelte';
  import FilterOrCopyButtons from '$lib/holocene/filter-or-copy-buttons.svelte';
  import TableRow from '$lib/holocene/table/table-row.svelte';
  import { workflowFilters, workflowSorts } from '$lib/stores/filters';
  import { updateQueryParamsFromFilter } from '$lib/utilities/query/to-list-workflow-filters';
  import Checkbox from '$lib/holocene/checkbox.svelte';

  const dispatch = createEventDispatcher<{
    toggleWorkflow: { workflowRunId: string; checked: boolean };
  }>();

  export let bulkActionsEnabled: boolean = false;
  export let selected: boolean = false;
  export let namespace: string;
  export let workflow: WorkflowExecution;
  export let timeFormat: TimeFormat | string;
  export let checkboxDisabled: boolean;

  $: href = routeForEventHistory({
    namespace,
    workflow: workflow.id,
    run: workflow.runId,
  });

  let showFilterCopy = false;

  const onRowFilterClick = (
    attribute: 'WorkflowId' | 'WorkflowType',
    value: string,
  ) => {
    const filter = $workflowFilters.find((f) => f.attribute === attribute);
    const getOtherFilters = () =>
      $workflowFilters.filter((f) => f.attribute !== attribute);

    if (!filter) {
      const newFilter = {
        attribute,
        value,
        conditional: '=',
        operator: '',
        parenthesis: '',
      };
      $workflowFilters = [...getOtherFilters(), newFilter];
    } else {
      $workflowFilters = [...getOtherFilters()];
    }

    updateQueryParamsFromFilter($page.url, $workflowFilters, $workflowSorts);
  };

  const handleCheckboxChange = (event: CustomEvent<{ checked: boolean }>) => {
    dispatch('toggleWorkflow', {
      workflowRunId: workflow.runId,
      checked: event.detail.checked,
    });
  };
</script>

<TableRow {href} class="workflow-summary-row">
  {#if bulkActionsEnabled}
    <td style="padding: 0;">
      <Checkbox
        hoverable
        disabled={checkboxDisabled}
        bind:checked={selected}
        on:change={handleCheckboxChange}
      />
    </td>
  {/if}
  <td>
    <WorkflowStatus
      status={workflow.status}
      delay={getMilliseconds(workflow.startTime)}
    />
  </td>
  <td
    class="relative break-words pr-4"
    on:mouseover={() => (showFilterCopy = true)}
    on:focus={() => (showFilterCopy = true)}
    on:mouseleave={() => (showFilterCopy = false)}
    on:blur={() => (showFilterCopy = false)}
  >
    <span class="table-link">
      {workflow.id}
    </span>
    <FilterOrCopyButtons
      show={showFilterCopy}
      content={workflow.id}
      onFilter={() => onRowFilterClick('WorkflowId', workflow.id)}
      filtered={Boolean(
        $workflowFilters.find(
          (f) => f.attribute === 'WorkflowId' && f.value === workflow.id,
        ),
      )}
    />
    <p class="inline-time-cell">
      {formatDate(workflow.startTime, timeFormat)}
    </p>
  </td>
  <td
    class="relative truncate"
    on:mouseover={() => (showFilterCopy = true)}
    on:focus={() => (showFilterCopy = true)}
    on:mouseleave={() => (showFilterCopy = false)}
    on:blur={() => (showFilterCopy = false)}
  >
    <h3 class="md:hidden">Workflow Name:</h3>
    <button
      class="table-link"
      on:click|preventDefault|stopPropagation={() =>
        onRowFilterClick('WorkflowType', workflow.name)}
      aria-label="filter by {workflow.name} type"
    >
      {workflow.name}
    </button>
    <FilterOrCopyButtons
      show={showFilterCopy}
      content={workflow.name}
      onFilter={() => onRowFilterClick('WorkflowType', workflow.name)}
      filtered={Boolean(
        $workflowFilters.find(
          (f) => f.attribute === 'WorkflowType' && f.value === workflow.name,
        ),
      )}
    />
    <p class="inline-time-cell">
      {formatDate(workflow.endTime, timeFormat)}
    </p>
  </td>
  <td class="time-cell">
    <p>
      {formatDate(workflow.startTime, timeFormat)}
    </p>
  </td>
  <td class="time-cell">
    <p>
      {formatDate(workflow.endTime, timeFormat)}
    </p>
  </td>
</TableRow>

<style lang="postcss">
  :global(.workflow-summary-row:hover) {
    @apply bg-gradient-to-br from-blue-100 to-purple-100 bg-fixed;

    .table-link {
      @apply text-blue-700 underline decoration-blue-700;
    }
  }

  .time-cell {
    @apply max-xl:hidden;
  }

  .inline-time-cell {
    @apply xl:hidden;
  }
</style>
