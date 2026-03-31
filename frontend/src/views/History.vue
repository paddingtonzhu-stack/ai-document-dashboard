<template>
  <div class="page">
    <h1>History</h1>
    <p class="subtitle">Previously processed documents.</p>

    <div v-if="loading" class="status">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="docs.length === 0" class="status">No documents yet. Upload one to get started.</div>

    <div v-else>
      <div
        v-for="doc in docs"
        :key="doc.id"
        class="card history-item"
        :class="{ expanded: expanded === doc.id }"
        @click="toggle(doc.id)"
      >
        <div class="history-header">
          <span class="filename">{{ doc.filename }}</span>
          <span class="meta">{{ formatDate(doc.created_at) }}</span>
          <span class="chevron">{{ expanded === doc.id ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expanded === doc.id" class="history-body">
          <h3>📋 Summary</h3>
          <p>{{ doc.summary }}</p>

          <template v-if="doc.technicalSkills?.length">
            <h3>💻 Technical Skills</h3>
            <div class="tags">
              <span v-for="s in doc.technicalSkills" :key="s" class="tag tag--tech">{{ s }}</span>
            </div>
          </template>

          <template v-if="doc.softSkills?.length">
            <h3>🤝 Soft Skills</h3>
            <div class="tags">
              <span v-for="s in doc.softSkills" :key="s" class="tag tag--soft">{{ s }}</span>
            </div>
          </template>

          <template v-if="doc.languageSkills?.length">
            <h3>🌐 Language Requirements</h3>
            <ul><li v-for="(l, i) in doc.languageSkills" :key="i">{{ l }}</li></ul>
          </template>

          <template v-if="doc.experience?.length">
            <h3>📅 Experience</h3>
            <ul><li v-for="(e, i) in doc.experience" :key="i">{{ e }}</li></ul>
          </template>

          <template v-if="doc.education?.length">
            <h3>🎓 Education</h3>
            <ul><li v-for="(e, i) in doc.education" :key="i">{{ e }}</li></ul>
          </template>

          <template v-if="doc.keyPoints?.length">
            <h3>📌 Other Key Points</h3>
            <ul><li v-for="(p, i) in doc.keyPoints" :key="i">{{ p }}</li></ul>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchHistory, type DocumentRecord } from '../services/api';

const docs = ref<DocumentRecord[]>([]);
const loading = ref<boolean>(true);
const error = ref<string>('');
const expanded = ref<string | null>(null);

onMounted(async () => {
  try {
    docs.value = await fetchHistory();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
});

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id;
}

function formatDate(dt: string) {
  return new Date(dt + 'Z').toLocaleString();
}
</script>
