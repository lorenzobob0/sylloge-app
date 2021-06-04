<template>
  <div class="hello">
    <h1>Settings</h1>
    <p>
      <el-button @click="destroyLocal" type="danger">Destroy local data</el-button>
      <el-button @click="legacySync" type="danger">Import Sylloge legacy data from cloud</el-button>
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
    }
    
    
  }

}
</script>
