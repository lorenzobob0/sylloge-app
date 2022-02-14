<template>
  <div class="hello">
    <h1>Welcome Login to Sylloge v.2 ALPHA</h1>
      <div id="dbs-container">
        <el-card class="box-card" v-for="db in databases" :key="db.name">
          <template #header>
            <div class="card-header">
              <span>{{ db.name }}</span>
            </div>
          </template>
          <el-icon><magic-stick/></el-icon> ms
          <el-button type="success" @click="openDB(db)">Open</el-button>
          <el-button type="danger" @click="deleteDB(db)">Delete</el-button>
        </el-card>
      </div>  
    <el-button type="success" @click="createDB">New Database</el-button>
  </div>
</template>

<script>
import axios from 'axios'
import Models from './Models'
import localforage from 'localforage'


export default {
  name: 'LoginComponent',
  data: function () {
    return {
      databases: []
    }
  },
  methods: {
    openDB: function (db) {
      const self = this
      Models.initDB(db.id)
      self.$router.isAuthenticated = true
      alert(self.$router.isAuthenticated)
      self.$router.push('/coins')
    },
    deleteDB: function (db) {
      const self = this
      if (confirm('Do you really want to delete the database?')) {
        Models.initDB(db.id)
        Models.destroyDB()
        self.$router.isAuthenticated = false

        let idx = 0
        for (idx = 0; idx < self.databases.length; idx++) {
          if (self.databases[idx].id == db.id) {
            break
          }
        }
        if (idx < self.databases.length) {
          self.databases.splice(idx, 1)
        }
        localforage.setItem('local_dbs', JSON.stringify(self.databases))
      }
    },
    createDB: async function () {
      const self = this
      if (self.databases == null) {
        self.databases = []
      }
      self.databases.push({
        'id': Models.createUUID(),
        'name': prompt('Please give a name to the DB')
      })
      await localforage.setItem('local_dbs', JSON.stringify(self.databases))
      
    },
    login: async function () {
      let url = Models.connectionURL(this.username, this.password)

      let res = await axios.post(url)
      console.log(res.body)
    }
  },
  created: async function () {
    const self = this
    try {
      let dbs = await localforage.getItem('local_dbs')
      self.databases = JSON.parse(dbs)
      console.log(self.databases)
    } catch (err) {
      console.log(err)
    }
  }
}
</script>

<style scoped>

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  width: 480px;
}

#dbs-container {
  display: flex;
  align-content: center;
  padding-bottom: 40px;
  justify-content: center;
}
</style>
