<template>
  <el-container id="main-container">
    <el-main>
      <router-view></router-view>
    </el-main>

  </el-container>
</template>

<script>
import HomeView from "./components/HomeView.vue";
import CoinsView from "./components/CoinsView.vue";
import { House, Coin, FolderOpened, Setting } from '@element-plus/icons-vue'
import Models from './components/Models'

export default {
  name: "App",
  components: {
    "home-view": HomeView,
    "coins-view": CoinsView,
    House, Coin, FolderOpened, Setting
  },
  created: function () {
    const self = this
    Models.initDB('sylloge-2')
    self.$router.isAuthenticated = true
  },
  mounted: function () {
    this.$root.historyCount = window.history.length
  },
  methods: {
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

<style>
body {
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 60px; /* Per navbar */
  padding-bottom: 60px; /* Per pulsanti eventuali*/
}

#main-container {
  display: flex;
  flex-direction: column;
}

textarea {
  font-family: Arial;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.el-main {
  padding: 0 !important;
}

#buttonbar-affix-bottom {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  z-index: 9999;

  text-align: right;
  padding: 20px;
}

</style>
