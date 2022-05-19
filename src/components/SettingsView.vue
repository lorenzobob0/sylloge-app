<template>
  <div class="settings">
    <sylloge-menu :homeIndex="4" />
    <h1>Settings</h1>
    <p>
        <el-button @click="exportData" class="setting-btn" type="success">Export data (local backup)</el-button>
    </p>
    <p>
      <el-upload
        :show-file-list="false"
        :on-success="importData"
        :auto-upload="true"
        :before-upload="importData"
      >
        <el-button type="success" >Load backup</el-button>
        <template #tip>
          <div class="el-upload__tip">
            You can use .db files (JSON), previously exported from this app
          </div>
        </template>
      </el-upload>
    </p>
    <p>
        <el-button @click="destroyLocal" class="setting-btn" type="danger">Destroy local data</el-button>
    </p>
    <p>
        <el-button @click="importLegacyDialog=true" class="setting-btn" type="primary">Import Sylloge-app v.1 legacy data from cloud</el-button>
    </p>
    <p>
      <el-button @click="syncDataDialog = true" class="setting-btn" type="success">Enable Sync</el-button>
    </p>

    <el-dialog
        v-model="importLegacyDialog"
        title="Legacy Import"
        width="300px"
      >
        <span>Do you want to import legacy data from the previous Sylloge version?</span>
        <template #footer>
          <span class="dialog-footer">
            <el-input v-model="importLegacyUsername" placeholder="Legacy Username (email)" />
            <el-input v-model="importLegacyPassword" placeholder="Legacy Password" type="password" show-password />
            <el-button @click="importLegacyDialog=false">Cancel</el-button>
            <el-button type="primary" @click="legacySync"
              >Confirm</el-button
            >
          </span>
        </template>
    </el-dialog>

  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import axios from 'axios'
import SylllogeMenu from './SylllogeMenu.vue'
import settings from './SyllogeSettings'

export default {
  name: 'SettingsView',
  components: {
    'sylloge-menu': SylllogeMenu
  },
  data () {
    return {
      loading: false,
      importLegacyDialog: false,
      importLegacyUsername: null,
      importLegacyPassword: null,
      syncDataDialog: false,
      syncDataServer: 'https://sylloge-app.com/db/',
      syncDataUsername: '', 
      syncDataPassword: '',
      syncDataDB: '', // '/userdb-' + hexEncode(username.toLowerCase()
      syllogeSettings: settings() 
    }
  },
  methods: {
  
    async destroyLocal () {
      if (confirm('Please confirm you want to delete the local data. This can not be undone. Continue?')) {
        await ModelsAPI.destroyDB()
        let globalDB = await ModelsAPI.initDB()
        alert('Local data deleted')
      }
    },

    async legacySync () {
      const self = this
      self.importLegacyDialog = false

      let bucketID = ''
      try {
        let res = await axios.post('https://www.sylloge-app.com/sync/sync_id', {
          'u': self.importLegacyUsername,
          'p': self.importLegacyPassword
        })
        console.log(res)
        bucketID = res.data.success
      } catch (err) {
        alert('Login error.')
        self.importLegacyDialog = true
        return
      }



      let globalDB = await ModelsAPI.initDB()
      let loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      alert('Please be patient, it may take a while. Do not close the app or reload the page.')
      await ModelsAPI.migrate2Pouch(bucketID)
      alert('Import complete')
      loading.close()
    },

    async importData (file) {
      let globalDB = await ModelsAPI.initDB()
      
      if (file) {
        const reader = new FileReader()
        reader.onload = ({target: {result}}) => {
          globalDB.bulkDocs(
            JSON.parse(result),
            {new_edits: false}, // not change revision
            (...args) => console.log('DONE', args)
          )
        }
        reader.readAsText(file)
      }
    },

    async exportData() {
      let globalDB = await ModelsAPI.initDB()
      let doc = await globalDB.allDocs({include_docs: true, attachments: true})
      this.download(
            JSON.stringify(doc.rows.map(({doc}) => doc)),
            'export.db',
            'text/plain'
      )
    },

    download(data, filename, type) {
      var file = new Blob([data], {type: type})
      if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename)
      else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file)
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(function() {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        }, 0)
    }
}
    
    
  }

}
</script>
<style scoped>
.setting-btn {
  width: 90%;
}
</style>
