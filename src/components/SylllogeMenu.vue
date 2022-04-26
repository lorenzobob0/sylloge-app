<template>
  <div id="sylloge-menu" class="affix">
    <el-menu
      :default-active="''+homeIndex"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      @select="handleTabClick"
    >
      <el-menu-item index="-1" v-if="backIsActive" >
        <slot>
          <span @click="goBack">
            <el-icon><arrow-left /></el-icon>
            Back
          </span>
        </slot>
      </el-menu-item>


      <el-menu-item index="1">
        <el-icon><house /></el-icon> &nbsp; Home
      </el-menu-item>
      <el-menu-item index="2">
        <el-icon><coin /></el-icon> &nbsp; My Coins
      </el-menu-item>
      <el-menu-item index="3">
        <el-icon><folder-opened /></el-icon> &nbsp; Albums
      </el-menu-item>
      <el-menu-item index="4">
        <el-icon><setting /></el-icon> &nbsp; Settings
      </el-menu-item>
            
    </el-menu>
  </div>
</template>

<script>
import { House, Coin, FolderOpened, Setting, ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: "SylllogeMenu",
  components: {
    House, Coin, FolderOpened, Setting, ArrowLeft
  },
  props: {
    homeIndex: Number
  },
  computed: {
    backIsActive: function () {
      console.log(window.history.length)
      console.log(this.$router.currentRoute._value.fullPath)
      if (this.$router.currentRoute._value.fullPath == '/') {
        return false
      }
      return window.history.length > this.$root.historyCount
    }
  },
  /*
  mounted: function () {
    console.log('navbar: ' + this.$router.currentRoute._value.path)
    console.log(this.$router.currentRoute._value)
    if (this.$router.currentRoute._value.path == '/') {
      this.homeIndex = "1"
    }
  },
  */
  methods: {
    currentPath() {
      return this.$route.path
    },

    goBack() {
      this.$router.go(-1);
    },

    handleTabClick(idx) {
      switch (parseInt(idx)) {
        case 1:
          this.$router.push("/");
          break;
        case 2:
          this.$router.push("/coins");
          break;
        case 3:
          this.$router.push("/albums");
          break;
        case 4:
          this.$router.push("/settings");
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style scoped>
#sylloge-menu {
  padding-bottom: 10px;
}
.right-menus {
  float: right;
}

.affix {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
}
</style>
