<script lang="ts">
  import { page } from '$app/stores';
  import { routeForEventHistory } from '$lib/utilities/route-for';
  import { workflowRun } from '$lib/stores/workflow-run';

  import Accordion from '$lib/holocene/accordion.svelte';
  import Badge from '$lib/holocene/badge.svelte';
  import ChildWorkflowsTable from '$lib/components/workflow/child-workflows-table.svelte';
  import WorkflowDetail from '$lib/components/workflow/workflow-detail.svelte';

  export let hasChildren: boolean;
  export let hasRelationships: boolean;
  export let first: string;
  export let parent: WorkflowIdentifier;
  export let next: string;
  export let previous: string;

  $: ({ workflow, namespace } = $page.params);
</script>

<section>
  <Accordion title="Relationships" icon="relationship">
    <div slot="summary" class="hidden flex-row gap-2 lg:flex">
      <Badge type={parent ? 'purple' : 'gray'}>{parent ? 1 : 0} Parent</Badge>
      <Badge type={hasChildren ? 'purple' : 'gray'}
        >{$workflowRun.workflow.pendingChildren.length} Pending Children</Badge
      >
      <Badge type={first ? 'purple' : 'gray'}>{first ? 1 : 0} First</Badge>
      <Badge type={previous ? 'purple' : 'gray'}>
        {previous ? 1 : 0} Previous
      </Badge>
      <Badge type={next ? 'purple' : 'gray'}>{next ? 1 : 0} Next</Badge>
    </div>
    {#if hasRelationships}
      <div class="flex w-full flex-wrap gap-4">
        {#if parent}
          <div class="w-[calc(50%-1rem)]">
            <h3 class="font-medium">Parent</h3>
            <div class="h-0.5 w-full rounded-full bg-gray-900" />
            <WorkflowDetail
              title="Workflow ID"
              content={parent.workflowId}
              copyable
              href={routeForEventHistory({
                namespace,
                workflow: parent.workflowId,
                run: parent.runId,
              })}
            />
            <WorkflowDetail
              title="Run ID"
              content={parent.runId}
              copyable
              href={routeForEventHistory({
                namespace,
                workflow: parent.workflowId,
                run: parent.runId,
              })}
            />
          </div>
        {/if}
        {#if first}
          <div class="w-[calc(50%-1rem)]">
            <h3 class="font-medium">First</h3>
            <div class="h-0.5 w-full rounded-full bg-gray-900" />
            <WorkflowDetail
              title="First Execution Run ID"
              content={first}
              copyable
              href={routeForEventHistory({
                namespace,
                workflow,
                run: first,
              })}
            />
          </div>
        {/if}
        {#if previous}
          <div class="w-[calc(50%-1rem)]">
            <h3 class="font-medium">Previous</h3>
            <div class="h-0.5 w-full rounded-full bg-gray-900" />
            <WorkflowDetail
              title="Continued Execution Run ID"
              content={previous}
              copyable
              href={routeForEventHistory({
                namespace,
                workflow,
                run: previous,
              })}
            />
          </div>
        {/if}
        {#if next}
          <div class="w-[calc(50%-1rem)]">
            <h3 class="font-medium">Next</h3>
            <div class="h-0.5 w-full rounded-full bg-gray-900" />
            <WorkflowDetail
              title="New Execution Run ID"
              content={next}
              copyable
              href={routeForEventHistory({
                namespace,
                workflow,
                run: next,
              })}
            />
          </div>
        {/if}
      </div>
      {#if hasChildren}
        <ChildWorkflowsTable
          pendingChildren={$workflowRun.workflow.pendingChildren}
          namespace={$page.params.namespace}
        />
      {/if}
    {:else}
      <p>This workflow doesn’t have any relationships</p>
    {/if}
  </Accordion>
</section>
