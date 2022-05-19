<template>
  <div>
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
    <sylloge-menu :homeIndex="2" />
    <div id="main-page">
      <el-form label-width="120px">
        <el-form-item label="Inventory no.:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Code" v-model="coin.code"></el-input>
        </el-form-item>

        <el-row class="form-element" style="text-align:center">
          <el-col id="row-imgs" :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <image-field-view :img="imgObv" @changed="updateImageObv" />
          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <image-field-view :img="imgRev" @changed="updateImageRev" />
          </el-col>
        </el-row>

        <el-form-item label="Authority:">
            <el-autocomplete 
              placeholder="Authority"
              @keypress="markDirty()" @change="markDirty()" 
              v-model="coin.ruler" 
              :fetch-suggestions="suggestRuler" clearable></el-autocomplete>
        </el-form-item>

        <el-form-item label="Mint:">
            <el-autocomplete placeholder="Mint" @keypress="markDirty()" @change="markDirty()" v-model="coin.mint" :fetch-suggestions="suggestMint" clearable></el-autocomplete>
        </el-form-item>

        <el-form-item label="Description:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="" autosize type="textarea" v-model="coin.coinType"></el-input>
        </el-form-item>

        <el-form-item label="Obverse:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Obverse" autosize type="textarea" v-model="coin.obverse"></el-input>
        </el-form-item>

        <el-form-item label="Reverse:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Reverse" autosize type="textarea" v-model="coin.reverse"></el-input>
        </el-form-item>

        <el-form-item label="Biblio:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Biblio" v-model="coin.biblio"></el-input>
        </el-form-item>

        <el-form-item label="Diameter:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Diameter" v-model="coin.diameter"></el-input>
        </el-form-item>

        <el-form-item label="Weight:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Weight" v-model="coin.weight"></el-input>
        </el-form-item>

        <el-form-item label="Metal:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Metal" v-model="coin.metal"></el-input>
        </el-form-item>

        <el-form-item label="Notes:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Notes" autosize type="textarea" v-model="coin.notes"></el-input>
        </el-form-item>

        <el-form-item label="Price:">
        <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Price" v-model="coin.price"></el-input>
        </el-form-item>

        <el-form-item label="Provenance:">
          <el-input @keypress="markDirty()" @change="markDirty()" placeholder="Provenance" v-model="coin.provenance"></el-input>
        </el-form-item>


        <el-form-item label="Albums:">
          <el-select v-model="belongToAlbums" @change="markDirty()" multiple placeholder="Albums">
            <el-option
              v-for="album in albums"
              :key="album.album._id"
              :label="album.album.name"
              :value="album.album._id">
            </el-option>
          </el-select>
        </el-form-item>
        <!--
        <el-button type="success" icon="el-icon-circle-check" circle @click="saveData()"></el-button>
        <el-button type="danger" icon="el-icon-delete" circle></el-button>
        -->
      </el-form>
    </div>

  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import ImageTools from './ImageTools.js'
import ImageFieldView from './ImageFieldView.vue'
import { Delete, ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import SylllogeMenu from './SylllogeMenu.vue'


export default {
  name: 'CoinEditView',
  components: {
    'image-field-view': ImageFieldView,
    'sylloge-menu': SylllogeMenu,
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
    suggestRuler (queryString, callBack) {
      const self = this
      queryString = queryString.toLowerCase()
      let suggestions = []
      for (let i = 0; i < self.rulers.length; i++) {
        let e = self.rulers[i]
        if (e.toLowerCase().startsWith(queryString)) {
          suggestions.push({ value: e })
        }
      }
      callBack(suggestions)
    },
    suggestMint (queryString, callBack) {
      const self = this
      queryString = queryString.toLowerCase()
      let suggestions = []
      for (let i = 0; i < self.mints.length; i++) {
        let e = self.rulers[i]
        if (e.toLowerCase().startsWith(queryString)) {
          suggestions.push({ value: e })
        }
      }
      callBack(suggestions)
    },

    markDirty() {
      this.dirty = true
      console.log(this.belongToAlbums)
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
      console.log(allAlbums.docs)
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
      let rev = self.coin._rev
      let res = null
      console.log(self.coin)
      console.log(self.coin._rev)
      res = await globalDB.put(self.coin)
      rev = self.coin._rev = res.rev

      if (self.imgObvData != null) {
        res = await globalDB.putAttachment(self.coin._id, 'imgObv', rev, self.imgObvData, 'image/jpeg') 
      } else {
        res = await self.removeAttachmentAsync(globalDB, self.coin._id, 'imgObv', rev)
      }
      rev = self.coin._rev = res.rev
      if (self.imgRevData != null) {
        res = await globalDB.putAttachment(self.coin._id, 'imgRev', rev, self.imgRevData, 'image/jpeg') 
      } else {
        res = await self.removeAttachmentAsync(globalDB, self.coin._id, 'imgRev', rev)
      }
      rev = self.coin._rev = res.rev
      
      for (let i = 0; i < self.albums.length; i++) {
        let a = self.albums[i].album
        if (typeof a.coins === 'undefined') {
          a.coins = []
        }
        if (self.belongToAlbums.indexOf(a._id) >= 0) {
          console.log('Salva associazione album moneta')
          console.log(a)
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
      console.log(rev)

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


.coin-desc {
  text-align: left;
}


#row-imgs {
  padding-bottom: 5px;
  display: flex;
  justify-content: center;
}

#main-page {
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
}
.form-element {
  margin-bottom: 2em;
  text-align: left;
}
</style>
