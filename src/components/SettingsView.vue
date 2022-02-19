<template>
  <div class="hello">
    <h1>Settings</h1>
    <p>
      <el-button @click="destroyLocal" type="danger">Destroy local data</el-button>
      <el-button @click="legacySync" type="danger">Import Sylloge legacy data from cloud</el-button>

      <el-button @click="exportData" type="danger">Export data</el-button>

      <el-upload
        :show-file-list="false"
        :on-success="importData"
        :auto-upload="true"
        :before-upload="importData"
      >
        <el-button type="primary">Load backup</el-button>
        <template #tip>
          <div class="el-upload__tip">
            .db files (JSON), previously exported from this app
          </div>
        </template>
      </el-upload>

      <el-button @click="importData" type="danger">Import data</el-button>
    </p>
  </div>
</template>

<script>
import ModelsAPI from './Models.js'
export default {
  name: 'SettingsView',
  data () {
    return {
      loading: false,
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
      let globalDB = await ModelsAPI.initDB()
      if (confirm('Do you want to import legacy data from the previous Sylloge version?')) {
        let loading = this.$loading({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        alert('Please be patient, it may take a while. Do not close the app.')
        await ModelsAPI.migrate2Pouch()
        alert('Import complete')
        loading.close()
      }
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
