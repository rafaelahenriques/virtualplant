import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    // ml5 is a single prebuilt bundle of about 4 MB, loaded on demand.
    chunkSizeWarningLimit: 5000,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
