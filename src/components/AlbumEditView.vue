<template>
  <div class="album-edit-view">
    <div id="buttonbar-affix-bottom">
      <el-button v-if="dirty" type="success" round @click="saveData">
        <el-icon><circle-check /></el-icon>
        <template #title>Save</template>
      </el-button>
      <el-button type="danger" round @click="deleteRecord">
        <el-icon><delete /></el-icon>
        <template #title>Delete</template>
      </el-button>            
    </div>
    <sylloge-menu :homeIndex="3" />

    <div id="main-page">
      <el-form label-width="120px">
        <el-row class="form-element" style="text-align:center">
          <el-col id="row-imgs" :span="24">
            <image-field-view :img="cover" @changed="updateCover" />
          </el-col>
        </el-row>

        <el-form-item label="Title:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="" autosize v-model="album.name"></el-input>
        </el-form-item>
        <el-form-item label="Description:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="" autosize type="textarea" v-model="album.albumDescription"></el-input>
        </el-form-item>

        <h3>Album content:</h3>
        <el-button @click="addMeta()">Add notes / images</el-button>
        <draggable class="albums-container dragArea list-group w-full" :list="albumCoins" @change="persistOrder">
          <div v-for="c in albumCoins" :key="c.id">
            <coin-row-view  v-if="typeof c.doc !== 'undefined' && c.doc.type == 'Coin'" :coin="c" @click="editCoin(c)"></coin-row-view>
            <div v-else style="text-align: center;" >
              <img v-if="c._img" :src="c._img" @click="editMeta(c)" />
              <p align="left" @click="editMeta(c)">{{c.text}}</p>
            </div>
          </div>
        </draggable>
      </el-form>
    </div>

    <el-dialog
      title="Edit notes"
      v-model="metaEditVisible" >
      <image-field-view :img="currentMetaSelected._img" @changed="updateMetaImg" />
      <el-input @change="markDirty()" placeholder="" v-model="currentMetaSelected.text"></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="metaEditVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import ImageTools from './ImageTools.js'
import ImageFieldView from './ImageFieldView.vue'
import CoinRowView from './CoinRowView.vue'
import { VueDraggableNext } from 'vue-draggable-next'
import { Delete, ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import SylllogeMenu from './SylllogeMenu.vue'

export default {
  name: 'AlbumEditView',
  components: {
    'coin-row-view': CoinRowView,
    'draggable': VueDraggableNext,
    'image-field-view': ImageFieldView,
    'sylloge-menu': SylllogeMenu,
    Delete, ArrowLeft, CircleCheck
  },
  props: [
    'id'
  ],
  data () {
    return {
      album: {},
      albumCoins: [],
      cover: null,
      coverData: null,
      dirty: false,
      metaEditVisible: false,
      currentMetaSelected: {},
    }
  },
  async mounted () {
    const self = this
    let globalDB = await ModelsAPI.initDB()
    try {
      self.album = await globalDB.get(self.id, {
        attachments: true
      })

      if (typeof self.album._attachments !== 'undefined' && typeof self.album._attachments.cover !== 'undefined') {
        let atc = await globalDB.getAttachment(self.album._id, 'cover')
        let url = URL.createObjectURL(atc)
        self.cover = url
        self.coverData = atc
      }

      let coinsIDs = []
      if (typeof self.album.coins !== 'undefined') {
        for (let i = 0; i < self.album.coins.length; i++) {
          if (typeof self.album.coins[i] === 'string') {
            coinsIDs.push(self.album.coins[i])
          }
        }
      }

      console.log(coinsIDs)

      let albumCoins = await globalDB.allDocs({
        keys: coinsIDs,
        include_docs: true,
        attachments: true
      })
      for (let i = 0; i < albumCoins.rows.length; i++) {
        let c = albumCoins.rows[i].doc
        if (typeof c._attachments !== 'undefined') {
          if (typeof c._attachments.imgObv !== 'undefined') {
            let atc = await globalDB.getAttachment(c._id, 'imgObv')
            let url = URL.createObjectURL(atc);
            c.imgObv = url
          }
          if (typeof c._attachments.imgRev !== 'undefined') {
            let atc = await globalDB.getAttachment(c._id, 'imgRev')
            let url = URL.createObjectURL(atc);
            c.imgRev = url
          }
        }
      }
      self.albumCoins = albumCoins.rows

      // Cicla di nuovo ed aggiungi i meta
      if (typeof self.album.coins !== 'undefined') {
        for (let j = 0; j < self.album.coins.length; j++) {
          if (typeof self.album.coins[j] !== 'string') {
            let meta = this.album.coins[j]
            console.log(meta.imageID)

            try {
              let url = ''
              if (typeof meta.imageID !== 'undefined' && meta.imageID != '') {
                let atc = await globalDB.getAttachment(self.album._id, meta.imageID)
                url = URL.createObjectURL(atc);
              }      
              meta._img = url
            } catch (error) {
              console.log(error)              
            }
            
            self.albumCoins.splice(j, 0, meta)
            j++
          }
        }
      }

      console.log(self.albumCoins)
    } catch (err) {
        console.error(err)
    }
  },
  async beforeRouteLeave(to, from) {
    // called when the route that renders this component is about to
    // be navigated away from.
    // As with `beforeRouteUpdate`, it has access to `this` component instance.
    if (this.dirty) {
      if (confirm('Do you want to save before leaving this page?')) {
        // salva
        this.saveData()
      }
    }
    return true
  },
  methods: {
    updateMetaImg (fileBlob) {
      const self = this
      if (fileBlob !== null) {
        self.currentMetaSelected._imgData = fileBlob
        self.currentMetaSelected._img  = URL.createObjectURL(fileBlob)
        self.currentMetaSelected.imageID = 'META-IMG-' + ModelsAPI.createUUID();

      } else {
        self.currentMetaSelected._imgData = null
        self.currentMetaSelected._img = null
      }
      self.markDirty()
      return false

    },
    editMeta (m) {
      const self = this
      self.currentMetaSelected = m
      self.metaEditVisible = true
    },
    addMeta () {
      let self = this
      self.albumCoins.splice(0, 0, {
        type: 'meta',
        text: 'new meta description'
      })
      self.persistOrder()
    },
    persistOrder () {
      const self = this
      self.album.coins = []
      for (let i = 0; i < self.albumCoins.length; i++) {
        if (typeof self.albumCoins[i].id !== 'undefined') {
          self.album.coins.push(self.albumCoins[i].id)
        } else {
          // Push del meta
          self.album.coins.push(self.albumCoins[i])
        }
      }
      self.markDirty()
    },
    editCoin (coin) {
      this.$router.push('/coin_edit/' + coin.id)
    },
    markDirty() {
      this.dirty = true
    },
    async updateCover(fileBlob) {
      if (fileBlob !== null) {
        this.coverData = fileBlob
        this.cover = URL.createObjectURL(fileBlob)
      } else {
        this.coverData = null
        this.cover = null
      }
      this.markDirty()
      return false
    },

    removeAttachmentAsync(db, id, name, rev) {
      return new Promise((resolve, reject) => {
        db.removeAttachment(id, name, rev).then(function (result) {
          if (result == undefined) {
            resolve({'rev': rev})
          } else {
            resolve(result)
          }
        }).catch(function (err) {
          console.log(err)
          reject(err)
        })
      })
    },
    async saveData() {
      const self = this
      const globalDB = await ModelsAPI.initDB()

      // Imposta gli "_attachments"
      if (self.coverData != null) {
        self.album._attachments['cover'] = {
          content_type: 'image/jpeg',
          data: self.coverData
        }
      } else {
        if (typeof self.album._attachments != 'undefined' && typeof self.album._attachments['cover'] != 'undefined') {
          delete self.album._attachments['cover']
        }
      }


      if (typeof self.album.coins != 'undefined') {
        for (let j = 0; j < self.album.coins.length; j++) {
          if (typeof self.album.coins[j] !== 'string') {
            let meta = self.album.coins[j]
            let url = ''
            if (typeof meta.imageID !== 'undefined' && meta.imageID != '') {
              if (meta._imgData != null) {
                self.album._attachments[meta.imageID] = {
                  content_type: 'image/jpeg',
                  data: meta._imgData
                }
              } else {
                delete self.album._attachments[meta.imageID]
              }
            }

          }
        }
      }

      self.album.lastModified = new Date()
      let res = await globalDB.put(self.album)
      self.album._rev = res.rev
      self.dirty = false
    },
    goBack() {
      this.$router.go(-1)
    },
    async deleteRecord () {
      const self = this
      let globalDB = await ModelsAPI.initDB()

      if (confirm('Do you really want to delete this entry?')) {
        try {
          await globalDB.remove(self.album._id, self.album._rev)
        } catch (error) {
          console.error(error)
        }
        this.$router.go(-1)
      }
    }

  }
}
</script>

<style scoped>
#main-page {
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
}

.coin-desc {
  text-align: left;
}


#row-imgs {
  padding-bottom: 5px;
  display: flex;
  justify-content: center;
}

</style>
