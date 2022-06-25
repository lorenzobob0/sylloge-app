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
import axios from 'axios'

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
  created: async function () {
    const self = this
    Models.initDB('sylloge-2')
    self.$router.isAuthenticated = true
    self.checkLatestVersion()
    await self.syllogeSettings.load()
    if (self.syllogeSettings.autoActivate) {
      Models.enableSync(self.syllogeSettings.syncDataServer, self.syllogeSettings.syncDataUsername, self.syllogeSettings.syncDataPassword, self.syllogeSettings.syncDataDB, {
        complete: () => {
          self.syllogeSettings.syncStatus = 'complete'
        },
        paused: () => {
          self.syllogeSettings.syncStatus = 'paused'
        },
        denied: () => {
          self.syllogeSettings.syncStatus = 'denied'
        },
        active: () => {
          self.syllogeSettings.syncStatus = 'active'
        },
        error: () => {
          self.syllogeSettings.syncStatus = 'error'
        }
      })
    }
  },
  mounted: function () {
    this.$root.historyCount = window.history.length
    
    // Register to recevive sylloge links notification
    if (typeof window.api !== 'undefined') {
      window.api.receive('sylloge-link', async (message) => {
        const urlParams = new URLSearchParams(message)

        let c = {
          type: 'Coin',
          creationDate: new Date(),
          coinType: urlParams.get('type'),
          mint: urlParams.get('mint'),
          ruler: urlParams.get('ruler'),
          obv: urlParams.get('obv'),
          rev: urlParams.get('rev'),
          price: urlParams.get('paid')
        }

        const obvURL = urlParams.get('obvURL')
        console.log(obvURL)
        if (obvURL != null) {
          let ovbURLdata = await axios.post('https://sylloge-app.com/sync/get_image', {
            image_url: 'https://' + obvURL
          })
          console.log(ovbURLdata)
          c.imgObv = ovbURLdata.data
        }

        const revURL = urlParams.post('revURL')
        if (revURL != null) {
          let revURLdata = await axios.get('https://sylloge-app.com/sync/get_image', {
            image_url: 'https://' + revURL
          })
          c.imgRev = revURLdata.data
        }

        console.log(c)

        try {
          const globalDB = await Models.initDB()
          let doc = await globalDB.post(c)
          console.log(doc)
          this.$router.push('/coin_edit/'+ doc.id );
        } catch (err) {
          console.error(err)
        }
      })
    }
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
  margin-top: 60px;
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
