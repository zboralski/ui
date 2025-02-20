<script lang="ts">
  import Tab from '$lib/holocene/tab.svelte';
  import SchedulesIntervalView from './schedules-interval-view.svelte';
  import ScheduleDayOfWeekView from './schedule-day-of-week-view.svelte';
  import ScheduleDayOfMonthView from './schedule-day-of-month-view.svelte';
  import Input from '$lib/holocene/input/input.svelte';
  import { page } from '$app/stores';
  import ScheduleFrequency from './schedule-frequency.svelte';

  let scheduleId = $page.params.schedule;

  let preset: SchedulePreset = scheduleId ? 'existing' : 'interval';

  export let schedule: FullScheduleSpec | null = null;
  export let daysOfWeek: string[];
  export let daysOfMonth: number[];
  export let months: string[];
  export let days: string;
  export let hour: string;
  export let minute: string;
  export let second: string;
  export let phase: string;
  export let cronString: string;

  const clearSchedule = () => {
    daysOfWeek = [];
    daysOfMonth = [];
    months = [];
    days = '';
    hour = '';
    minute = '';
    second = '';
    phase = '';
    cronString = '';
  };

  $: preset, clearSchedule();
</script>

<div class="mt-8 w-full">
  <h2 class="mb-4 text-2xl">Frequency</h2>
  <div class="flex flex-wrap gap-6">
    {#if schedule}
      <Tab
        label="Existing"
        testId="interval-tab"
        active={preset === 'existing'}
        on:click={() => (preset = 'existing')}
        on:keypress={() => (preset = 'existing')}
      />
    {/if}
    <Tab
      label="Interval"
      testId="interval-tab"
      active={preset === 'interval'}
      on:click={() => (preset = 'interval')}
      on:keypress={() => (preset = 'interval')}
    />
    <Tab
      label="Days of the Week"
      testId="daily-tab"
      active={preset === 'week'}
      on:click={() => (preset = 'week')}
      on:keypress={() => (preset = 'week')}
    />
    <Tab
      label="Days of the Month"
      testId="monthly-tab"
      active={preset === 'month'}
      on:click={() => (preset = 'month')}
      on:keypress={() => (preset = 'month')}
    />
    <Tab
      label="String"
      testId="string-tab"
      active={preset === 'string'}
      on:click={() => (preset = 'string')}
      on:keypress={() => (preset = 'string')}
    />
  </div>
  <div class="mt-4 flex w-full flex-wrap gap-6">
    {#if preset === 'existing'}
      <ScheduleFrequency
        calendar={schedule?.spec?.structuredCalendar?.[0]}
        interval={schedule?.spec?.interval?.[0]}
        class="text-base"
      />
    {:else if preset === 'interval'}
      <SchedulesIntervalView
        bind:days
        bind:hour
        bind:minute
        bind:second
        bind:phase
      />
    {:else if preset === 'week'}
      <ScheduleDayOfWeekView bind:daysOfWeek bind:hour bind:minute />
    {:else if preset === 'month'}
      <ScheduleDayOfMonthView
        bind:daysOfMonth
        bind:months
        bind:hour
        bind:minute
      />
    {:else if preset === 'string'}
      <div class="my-2 flex w-full flex-col gap-4">
        <h3 class="text-lg font-medium">String</h3>
        <p>Write or paste in a cron string to generate a schedule.</p>
        <Input
          id="cronString"
          bind:value={cronString}
          placeholder="* * * * *"
        />
      </div>
    {/if}
  </div>
  <slot {preset} />
</div>
