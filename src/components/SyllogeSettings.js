import { defineStore } from 'pinia'
import { ref } from 'vue'

const syllogeSettings = defineStore('sharedValueStore', {
  state: () => ({
    syncStatus: '',
    syncDataUsername: 'admin',
    syncDataPassword: '',
    syncDataServer: 'http://localhost:5984/',
    syncDataDB: 'db-name',

  }),
  actions: {
    setSyncStatus(value) {
      this.syncStatus = value
    }
  }, 
  getters: {
  }
})

export default syllogeSettings