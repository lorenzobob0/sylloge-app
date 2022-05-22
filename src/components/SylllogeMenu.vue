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
      <el-menu-item index="-1" v-if="false && backIsActive" >
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
      <el-menu-item index="5" v-if="syllogeSettings.syncStatus == '' ||  syllogeSettings.syncStatus == 'error'" @click="syncDataDialog = true">
        <el-icon><cloudy /></el-icon> &nbsp; Enable sync 
      </el-menu-item>
      <el-menu-item index="5" v-if="syllogeSettings.syncStatus != '' && syllogeSettings.syncStatus != 'error' " @click="stopSyncing">
        <el-icon><cloudy /></el-icon> &nbsp; Disable sync 
      </el-menu-item>
                   
    </el-menu>

    <el-dialog
      v-model="syncDataDialog"
      title="Data Sync"
      width="300px"
    >
      <span>
        <b>Experimental feature!</b><br/>
        Please specify a sync server name, a database name and server credentials.
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-input v-model="syllogeSettings.syncDataUsername" placeholder="Username" @change="syncDataUpdateDB" />
          <el-input v-model="syllogeSettings.syncDataPassword" placeholder="Password" type="password" show-password />
          <el-input v-model="syllogeSettings.syncDataServer" placeholder="Server URL" />
          <el-input v-model="syllogeSettings.syncDataDB" placeholder="db-name" />
          <el-button @click="syncDataDialog=false">Cancel</el-button>
          <el-button type="primary" @click="enableSync">Enable Sync</el-button
          >
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { House, Coin, FolderOpened, Setting, ArrowLeft, Cloudy } from '@element-plus/icons-vue'
import settings from './SyllogeSettings'
import ModelsAPI from './Models.js'

export default {
  name: "SylllogeMenu",
  data: function () {
    return {
      syllogeSettings: settings(),
      syncDataDialog: false
    }
  },
  components: {
    House, Coin, FolderOpened, Setting, ArrowLeft, Cloudy
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
  methods: {

    syncDataUpdateDB() {
      const self = this
      const hexEncode = function (str) {
        var hex, i
        var result = ''

        for (i = 0; i < str.length; i++) {
          hex = str.charCodeAt(i).toString(16)
          result += hex
        }
        return result
      }
      self.syllogeSettings.syncDataDB = 'userdb-' + hexEncode(self.syllogeSettings.syncDataUsername.toLowerCase())
    },

    stopSyncing () {
      const self = this
      ModelsAPI.disableSync()
      self.syllogeSettings.syncStatus = ''
    },

    enableSync () {
      const self = this
      ModelsAPI.enableSync(self.syllogeSettings.syncDataServer, self.syllogeSettings.syncDataUsername, self.syllogeSettings.syncDataPassword, self.syllogeSettings.syncDataDB, {
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
      this.syncDataDialog = false
    },

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
