<template>
  <div>
    <div id="side-tools">
      <el-menu :collapse="true">
        <el-menu-item  @click="goBack()">
          <el-icon><arrow-left /></el-icon>
          <template #title>Go back</template>
        </el-menu-item>
        
        <el-menu-item  @click="saveData()">
          <el-icon><circle-check /></el-icon>
          <template #title>Save</template>
        </el-menu-item>
        <el-menu-item @click="deleteRecord">
          <el-icon><delete /></el-icon>
          <template #title>Delete</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div id="main-page">
      <el-row>
        <el-col id="row-imgs" :span="12">
          <image-field-view :img="imgObv" @changed="updateImageObv" />
        </el-col>
        <el-col :span="12">
          <image-field-view :img="imgRev" @changed="updateImageRev" />
        </el-col>
      </el-row>
  
      <el-row>
        <el-col :span="12">
          <el-input placeholder="Ruler" v-model="coin.ruler"></el-input>
        </el-col>
        <el-col :span="12">
          <el-select v-model="coin.ruler" placeholder="Select">
            <el-option v-for="ruler in rulers" :key="ruler" :label="ruler" :value="ruler" />
          </el-select>  
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-input placeholder="Mint" v-model="coin.mint"></el-input>
        </el-col>
        <el-col :span="12">
          <el-select v-model="coin.mint" placeholder="Select">
            <el-option v-for="mint in mints" :key="mint" :label="mint" :value="mint" />
          </el-select>  
        </el-col>
      </el-row>
      <el-input @change="markDirty()" placeholder="General description" type="textarea" v-model="coin.coinType"></el-input>
      <el-input @change="markDirty()" placeholder="Obverse" v-model="coin.obverse"></el-input>
      <el-input @change="markDirty()" placeholder="Reverse" v-model="coin.reverse"></el-input>
      <el-input @change="markDirty()" placeholder="Biblio" v-model="coin.biblio"></el-input>
      <el-input @change="markDirty()" placeholder="Diameter" v-model="coin.diameter"></el-input>
      <el-input @change="markDirty()" placeholder="Weight" v-model="coin.weight"></el-input>
      <el-input @change="markDirty()" placeholder="Metal" v-model="coin.metal"></el-input>
      <el-input @change="markDirty()" placeholder="Notes" type="textarea" v-model="coin.notes"></el-input>
      <el-input @change="markDirty()" placeholder="Price &amp; Provenance" v-model="coin.price"></el-input>
      <el-input @change="markDirty()" placeholder="Code" v-model="coin.code"></el-input>

      <el-select v-model="belongToAlbums" multiple placeholder="Albums">
        <el-option
          v-for="album in albums"
          :key="album.album._id"
          :label="album.album.name"
          :value="album.album._id">
        </el-option>
      </el-select>
      
      <!--
      <el-button type="success" icon="el-icon-circle-check" circle @click="saveData()"></el-button>
      <el-button type="danger" icon="el-icon-delete" circle></el-button>
      -->
    </div>

  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import ImageTools from './ImageTools.js'
import ImageFieldView from './ImageFieldView.vue'
import { Delete, ArrowLeft, CircleCheck } from '@element-plus/icons-vue'

export default {
  name: 'CoinEditView',
  components: {
    'image-field-view': ImageFieldView,
    Delete, ArrowLeft, CircleCheck
  },
  props: [
    'id'
  ],
  data () {
    return {
      coin: {},
      imgObv: null,
      imgObvData: null,
      imgRev: null,
      imgRevData: null,
      mints: [],
      rulers: [],
      albums: [],
      belongToAlbums: [],
      dirty: false
    }
  },
  async mounted () {
    const self = this
    let globalDB = await ModelsAPI.initDB()
    try {
      self.coin = await globalDB.get(self.id, {
        attachments: true
      })
      if (typeof self.coin._attachments !== 'undefined' && typeof self.coin._attachments.imgObv !== 'undefined') {
        let atc = await globalDB.getAttachment(self.coin._id, 'imgObv')
        let url = URL.createObjectURL(atc)
        self.imgObv = url
        self.imgObvData = atc
      } 

      if (typeof self.coin._attachments !== 'undefined' && typeof self.coin._attachments.imgRev !== 'undefined') {
        let atc = await globalDB.getAttachment(self.coin._id, 'imgRev')
        let url = URL.createObjectURL(atc)
        self.imgRev = url
        self.imgRevData = atc
      }
      self.loadMintsEtc()
    } catch (err) {
        alert(err)
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
    markDirty() {
      this.dirty = true
    },
    async loadMintsEtc () {
      const self = this
      // Trova tutti i sovrani utilizzati finora
      let globalDB = await ModelsAPI.initDB()
      let allCoins = await globalDB.find({
        selector: {
          type: 'Coin'
        }
      });
      self.mints = [];
      self.rulers = [];

      for (let i = 0; i < allCoins.docs.length; i++) {
        let c = allCoins.docs[i];

        if (c.mint != '' && self.mints.indexOf(c.mint) == -1) {
          self.mints.push(c.mint);
        }

        if (c.ruler != '' && self.rulers.indexOf(c.ruler) == -1) {
          self.rulers.push(c.ruler);
        }
      }

      self.mints = self.mints.sort();
      self.rulers = self.rulers.sort();

      let allAlbums = await globalDB.find({
				selector: {
					type: 'Album'
				}
      })
      allAlbums.docs.sort(function (a, b) {
        return a.name > b.name
      })
      self.albums = []
      self.belongToAlbums = []
      for (let i = 0; i < allAlbums.docs.length; i++) {
        let selected = false
        let a = allAlbums.docs[i]
        if (typeof a.coins !== 'undefined') {
          if (a.coins.indexOf(self.coin._id) >= 0) {
            selected = true
            self.belongToAlbums.push(a._id)
          }
        }
        self.albums.push({
          selected: selected,
          album: allAlbums.docs[i]
        })
      }
      // Riordina gli album
      self.albums = self.albums.sort(function (a, b) {
        return a.album.name.localeCompare(b.album.name)
      })

    },
    async updateImageObv(fileBlob) {
      if (fileBlob !== null) {
        this.imgObvData = fileBlob
        this.imgObv = URL.createObjectURL(fileBlob)
      } else {
        this.imgObvData = null
        this.imgObv = null
      }
      this.dirty = true
      return false
    },
    async updateImageRev(fileBlob) {
      if (fileBlob !== null) {
        this.imgRevData = fileBlob
        this.imgRev = URL.createObjectURL(fileBlob)
      } else {
        this.imgRevData = null
        this.imgRev = null
      }
      this.dirty = true
      return false
    },
    goBack() {
      this.$router.go(-1)
    },
    async saveData() {
      const self = this
      const globalDB = await ModelsAPI.initDB()
      let rev = self.coin._rev
      let res = null
      res = await globalDB.put(self.coin)
      rev = self.coin._rev = res.rev

      if (self.imgObvData != null) {
        res = await globalDB.putAttachment(self.coin._id, 'imgObv', rev, self.imgObvData, 'image/jpeg') 
      } else {
        res = await globalDB.removeAttachment(self.coin._id, 'imgObv', rev)
      }
      rev = res.rev
      if (self.imgRevData != null) {
        res = await globalDB.putAttachment(self.coin._id, 'imgRev', rev, self.imgRevData, 'image/jpeg') 
      } else {
        res = await globalDB.removeAttachment(self.coin._id, 'imgRev', rev)
      }
      // Salva tutti i documenti
      for (let i = 0; i < self.albums.length; i++) {
        let a = self.albums[i].album
        if (self.belongToAlbums.indexOf(a._id) >= 0) {
          if (a.coins.indexOf(self.coin._id) < 0) {
            a.coins.push(self.coin._id)
            a.lastModified = new Date()
            try {
              let res = await globalDB.put(a)
              a._rev = res.rev
            } catch (err) {
              console.error(err)
            }
          }
        } else {
          let index = a.coins.indexOf(self.coin._id)
          if (index >= 0) {
            // Caso di inserimento multiplo
            while (a.coins.indexOf(self.coin._id) >= 0) {
              a.coins.splice(a.coins.indexOf(self.coin._id), 1)
              try {
                let res = await globalDB.put(a)
                a.album._rev = res.rev
              } catch (err) {
                console.error(err)
              }
            }
          }
        }
      }
      self.dirty = false
    },
    async deleteRecord () {
      const self = this
      let globalDB = await ModelsAPI.initDB()

      if (confirm('Do you really want to delete this entry?')) {
        for (let i = 0; i < self.albums.length; i++) {
          let album = self.albums[i].album
          let modified = false
          if (typeof album.coins !== 'undefined') {
            while (album.coins.indexOf(self.coin._id) >= 0) {
              album.coins.splice(album.coins.indexOf(self.coin._id), 1)
              modified = true
            }  
          }
          if (modified) {
            try {
              await globalDB.put(album)
            } catch (err) {
              console.error(err)
            }                  
          }
        }
        try {
          await globalDB.remove(self.coin._id, self.coin._rev)
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
#side-tools {
  position: fixed;
  top: 0;
  left: 0;
  width: 60px;
}
#main-page {
  margin-left: 60px;
}

.coin-desc {
  text-align: left;
}


#row-imgs {
  padding-bottom: 5px;
}
</style>
