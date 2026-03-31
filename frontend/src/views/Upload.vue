<template>
  <div class="page">
    <h1>Upload Document</h1>
    <p class="subtitle">Upload a PDF or TXT file to get an AI-generated summary and key points.</p>

    <div class="card">
      <div
        class="drop-zone"
        :class="{ 'drop-zone--over': dragging, 'drop-zone--filled': selectedFile }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
        @click="$refs.fileInput.click()"
      >
        <input ref="fileInput" type="file" accept=".pdf,.txt" hidden @change="onFileChange" />
        <template v-if="selectedFile">
          <span class="file-icon">📄</span>
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
        </template>
        <template v-else>
          <span class="drop-icon">⬆</span>
          <span>Drop file here or <strong>click to browse</strong></span>
          <span class="hint">PDF or TXT · max 10 MB</span>
        </template>
      </div>

      <button class="btn" :disabled="!selectedFile || loading" @click="submit">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Processing…' : 'Summarize' }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="result" class="card result">
      <h2>📋 Role Summary</h2>
      <p>{{ result.summary }}</p>

      <template v-if="result.technicalSkills?.length">
        <h2>💻 Technical Skills</h2>
        <div class="tags">
          <span v-for="s in result.technicalSkills" :key="s" class="tag tag--tech">{{ s }}</span>
        </div>
      </template>

      <template v-if="result.softSkills?.length">
        <h2>🤝 Soft Skills</h2>
        <div class="tags">
          <span v-for="s in result.softSkills" :key="s" class="tag tag--soft">{{ s }}</span>
        </div>
      </template>

      <template v-if="result.languageSkills?.length">
        <h2>🌐 Language Requirements</h2>
        <ul>
          <li v-for="(l, i) in result.languageSkills" :key="i">{{ l }}</li>
        </ul>
      </template>

      <template v-if="result.experience?.length">
        <h2>📅 Experience</h2>
        <ul>
          <li v-for="(e, i) in result.experience" :key="i">{{ e }}</li>
        </ul>
      </template>

      <template v-if="result.education?.length">
        <h2>🎓 Education</h2>
        <ul>
          <li v-for="(e, i) in result.education" :key="i">{{ e }}</li>
        </ul>
      </template>

      <template v-if="result.keyPoints?.length">
        <h2>📌 Other Key Points</h2>
        <ul>
          <li v-for="(p, i) in result.keyPoints" :key="i">{{ p }}</li>
        </ul>
      </template>

      <p class="meta">Saved as <strong>{{ result.filename }}</strong> · {{ formatDate(result.created_at) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { uploadDocument, type DocumentRecord } from '../services/api';

const selectedFile = ref<File | null>(null);
const loading = ref<boolean>(false);
const error = ref<string>('');
const result = ref<DocumentRecord | null>(null);
const dragging = ref<boolean>(false);
const fileInput = ref<HTMLInputElement | null>(null);

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
  error.value = '';
  result.value = null;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0] ?? null;
  if (file) {
    selectedFile.value = file;
    error.value = '';
    result.value = null;
  }
}

async function submit() {
  if (!selectedFile.value) return;
  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    result.value = await uploadDocument(selectedFile.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dt: string): string {
  return new Date(dt + 'Z').toLocaleString();
}
</script>
