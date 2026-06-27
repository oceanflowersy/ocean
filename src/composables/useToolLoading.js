import { computed, ref } from 'vue';

export function useToolLoading() {
  const loadingCount = ref(0);
  const loadingText = ref('');
  const loading = computed(() => loadingCount.value > 0);

  const runWithLoading = async (text, task) => {
    loadingText.value = text || '处理中...';
    loadingCount.value += 1;
    try {
      return await task();
    } finally {
      loadingCount.value = Math.max(0, loadingCount.value - 1);
      if (!loadingCount.value) loadingText.value = '';
    }
  };

  return { loading, loadingText, runWithLoading };
}
