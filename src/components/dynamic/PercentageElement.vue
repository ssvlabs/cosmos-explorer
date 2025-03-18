<template>
  <span>{{ formattedValue }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  value: string | number
}>();

// Function to format the value as a percentage (assuming input is 0-10000 representing 0-100%)
const formattedValue = computed(() => {
  const num = Number(props.value);
  
  if (isNaN(num)) {
    return '0%';
  }
  
  // Convert from 0-10000 scale to 0-100 scale
  const percentage = num / 100;
  
  // Format with up to 2 decimal places, but remove trailing zeros
  return `${percentage.toFixed(2).replace(/\.?0+$/, '')}%`;
});
</script>