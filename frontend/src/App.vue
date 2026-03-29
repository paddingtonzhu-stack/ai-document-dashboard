<script setup>
import { ref } from 'vue'

const content = ref('')
const summary = ref('')

const handleSubmit = async () => {
  const res = await fetch('http://localhost:3000/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: content.value })
  })

  const data = await res.json()
  summary.value = data.summary
}
</script>

<template>
  <div style="padding: 20px">
    <h1>AI Document Dashboard</h1>

    <textarea v-model="content" placeholder="Enter text..." rows="6" cols="50" />

    <br /><br />

    <button @click="handleSubmit">Summarize</button>

    <h2>Summary:</h2>
    <p>{{ summary }}</p>
  </div>
</template>