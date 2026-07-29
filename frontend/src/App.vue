<template>
  <div id="app">
    <a-layout style="min-height: 100vh">
      <a-layout-header style="padding: 0 40px; display: flex; align-items: center;">
        <div style="color: white; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">
          ✈️ HelloAgents Trip Planner
        </div>
      </a-layout-header>
      <a-layout-content style="padding: 0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
      <a-layout-footer style="text-align: center; color: var(--color-text-tertiary); font-size: var(--font-caption); background: transparent;">
        HelloAgents Trip Planner · Open Source Project
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

