<template>
  <el-affix id="side-nav"  :offset="0">
    <el-menu default-active="2"  :collapse="true">
      <el-menu-item index="1" @click="navigateTo('/')">
        <i class="el-icon-s-home"></i>
        <template #title>Home</template>
      </el-menu-item>
      <el-menu-item index="2" @click="navigateTo('/coins')">
        <i class="el-icon-coin"></i>
        <template #title>Coins</template>
      </el-menu-item>
      <el-menu-item index="3" disabled>
        <i class="el-icon-folder-opened"></i>
        <template #title>Albums</template>
      </el-menu-item>
      <el-menu-item index="4" @click="navigateTo('/coins')">
        <i class="el-icon-setting"></i>
        <template #title>Settings</template>
      </el-menu-item>
    </el-menu>
  </el-affix>
</template>

<script>
  export default {
    data() {
      return {};
    },
    methods: {
      navigateTo (path) {
        this.$router.push(path)
      }
    }
  }
</script>

<style scoped>
  .el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
  }
</style>