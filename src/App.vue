<template>
  <el-container id="main-container">
    <el-main>
      <router-view></router-view>
    </el-main>
    <div id="footer">
      <span v-if="syllogeSettings.syncStatus != ''" id="sync-status">Sync: {{syllogeSettings.syncStatus}}</span>
      Sylloge App 2 ({{version}}) 
      <span v-if="updateAvailable"><a target="_blank" :href="'https://github.com/lorenzobob0/sylloge-app/releases/tag/'+latestRelease">Update available: {{latestRelease}}</a></span>
    </div>
  </el-container>
</template>

<script>
import HomeView from "./components/HomeView.vue";
import CoinsView from "./components/CoinsView.vue";
import { House, Coin, FolderOpened, Setting } from '@element-plus/icons-vue'
import Models from './components/Models'
import settings from './components/SyllogeSettings'
import { checkLatestVersion, syllogeVersion } from './components/version'

export default {
  name: "App",
  components: {
    "home-view": HomeView,
    "coins-view": CoinsView,
    House, Coin, FolderOpened, Setting
  },
  data: function () {
    return {
      version: syllogeVersion(),
      syllogeSettings: settings(),
      syncDataDialog: false,
      updateAvailable: false,
      latestRelease: ''
    }
  },
  created: function () {
    const self = this
    Models.initDB('sylloge-2')
    self.$router.isAuthenticated = true
    this.checkLatestVersion()
  },
  mounted: function () {
    this.$root.historyCount = window.history.length
    
  },
  methods: {
    async checkLatestVersion () {
      let v = await checkLatestVersion()
      if (v != null) {
        this.updateAvailable = true
        this.latestRelease = v
      }
    }
  },
};
</script>

<style>
html {
  height: 100%;
}

body {
  margin: 0;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 60px;
  height: 100%;
}

#footer {
   position: fixed;
   left: 0;
   bottom: 0;
   width: 100%;
   background-color: rgb(0, 0, 0);
   color: white;
   text-align: center;
   font-family: 'Courier New', Courier, monospace;
   font-size: small;
   text-align: left;
   padding-left: 10px;
}
#footer a {
  color:green;
  font-weight: bold;
}

#sync-status {
  float: right;
  margin-right: 25px;
}


#main-container {
  height: 100%;
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
  z-index: 9999;

  text-align: right;
  padding: 20px;
}

</style>
