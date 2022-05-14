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
          <el-button type="success" @click="openDB(db)">
            <el-icon><folder-opened /></el-icon> &nbsp; Open
          </el-button>
          <el-button type="danger" @click="deleteDB(db)">
            <el-icon><delete /></el-icon>&nbsp; Delete
          </el-button>
        </el-card>
      </div>  
    <el-button type="success" @click="createDB">
      <el-icon><document-add /></el-icon>
      &nbsp; New Database</el-button>
  </div>
</template>

<script>
import axios from 'axios'
import Models from './Models'
import localforage from 'localforage'
import { Delete, FolderOpened, DocumentAdd } from '@element-plus/icons-vue'
import vex from 'vex-js'

export default {
  name: 'LoginComponent',
  components: {
    Delete, FolderOpened, DocumentAdd
  },
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
      self.$router.push('/coins')
    },
    deleteDB: async function (db) {
      const self = this
      let res = await vex.dialog.confirm({
        message: 'Do you really want to delete the database?',
        callback: function (value) {
            if (value) {
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
            } else {
                // no
            }
        }
      })
    },
    createDB: async function () {
      const self = this
      if (self.databases == null) {
        self.databases = []
      }
      vex.dialog.prompt({
        message: 'Please give a name to the DB?',
        placeholder: 'DB Name',
        callback: async function (value) {
          self.databases.push({
            'id': Models.createUUID(),
            'name': value
          })
          await localforage.setItem('local_dbs', JSON.stringify(self.databases))
        }
      })

      
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
