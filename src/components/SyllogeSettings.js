import { defineStore } from 'pinia'
import { ref } from 'vue'

const syllogeSettings = defineStore('sharedValueStore', {
  state: () => ({
    syncStatus: '',
    syncDataUsername: 'admin',
    syncDataPassword: '',
    syncDataServer: 'http://localhost:5984/',
    syncDataDB: 'db-name',
    saveSyncStatus: true,
    autoActivate: true
  }),
  actions: {
    setSyncStatus(value) {
      this.syncStatus = value
    },
    makePersistent() {
      let data = JSON.stringify({
        syncDataUsername: this.syncDataUsername,
        syncDataPassword: this.syncDataPassword,
        syncDataServer: this.syncDataServer,
        syncDataDB: this.syncDataDB,
        autoActivate: this.autoActivate
      })
      localStorage.setItem('syncStatus', data)
    },
    load() {
      let res = localStorage.getItem('syncStatus')
      if (res != null) {
        let data = JSON.parse(res)
        this.syncDataUsername = data.syncDataUsername
        this.syncDataPassword = data.syncDataPassword
        this.syncDataServer = data.syncDataServer
        this.syncDataDB = data.syncDataDB
        this.autoActivate = data.autoActivate
      }
      
    }
  }, 
  getters: {
  }
})

export default syllogeSettings