<template>
  <div class="albums">
    <sylloge-menu :homeIndex="3" />

    <el-row id="search-albums">
      <el-col :span="18">
        <el-input placeholder="Search albums" v-model="searchTerms" ></el-input>
      </el-col>
      <el-col :span="1">
      </el-col>

      <el-col :span="5">
        <el-button type="success" @click="addNewItem" style="width:100%">
          <el-icon><plus /></el-icon> <span class="hidden-xs-only" >&nbsp;&nbsp; New album </span>
        </el-button>  
      </el-col>
   
    </el-row>


    <div class="pagination-holder">
    </div>
    <el-empty v-if="albums.length == 0" description="No results" />
    <draggable class="albums-container dragArea list-group w-full" :list="albums" @change="persistOrder">
      <album-row-view v-for="album in albums" class="album" :key="album.id" :album="album" @edit="editAlbum(album)" @export="exportAlbum(album)" @view="viewAlbum(album)" ></album-row-view>
    </draggable>  
  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import AlbumRowView from './AlbumRowView.vue'
import { VueDraggableNext } from 'vue-draggable-next'
import SylllogeMenu from './SylllogeMenu.vue'
import { Plus, Search } from '@element-plus/icons-vue'

export default {
  name: 'AlbumsView',
  components: {
    'album-row-view': AlbumRowView,
    'draggable': VueDraggableNext,
    'sylloge-menu': SylllogeMenu,
    Plus,  Search
  },
  data () {
    return {
      searchTerms: '',
      albums: []
    }
  },
  mounted() {
    this.fetchAlbums()
  },
  methods: {

    async exportAlbum(album) {
      console.log(album)
      return
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
    },

    async fetchAlbums () {
      const self = this
      let globalDB = await ModelsAPI.initDB()

      let allAlbums = await globalDB.find({
        selector: {
          type: 'Album'
        }
      })

      let keys = []
      for (let i = 0; i < allAlbums.docs.length; i++) {
        keys.push(allAlbums.docs[i]._id)
      }

      

      allAlbums = await globalDB.allDocs({
        include_docs: true,
        keys: keys,
        attachments: true,
      })
      for (let i = 0; i < allAlbums.rows.length; i++) {
        let a = allAlbums.rows[i].doc
        if (typeof a._attachments !== 'undefined') {
          if (typeof a._attachments.image !== 'undefined') {
            let atc = await globalDB.getAttachment(a._id, 'image')
            let url = URL.createObjectURL(atc);
            a.imageURL = url
          }
        }
      }

      self.albums = allAlbums.rows.sort(function (a, b) {
        return a.doc.internalOrder > b.doc.internalOrder
      })

    },
    viewAlbum (album) {
      this.$router.push('/album_edit/' + album.id)
    },
    editAlbum (album) {
      this.$router.push('/album_view/' + album.id)
    },
    async addNewItem () {
      let c = {
        type: 'Album',
        creationDate: new Date(),
        name: 'New album',
        coins: []
      }

      try {
        let globalDB = await ModelsAPI.initDB()
        let doc = await globalDB.post(c)
        console.log(doc)
        this.$router.push('/album_edit/'+ doc.id );
      } catch (err) {
        console.error(err)
      }
    },
    updateFilter () {
      this.fetchAlbums()
    },
    async persistOrder () {
      let globalDB = await ModelsAPI.initDB()

      for (let i = 0; i < this.albums.length; i++) {
        let a = this.albums[i]
        a.doc.internalOrder = i;
        // a.doc.lastModified = new Date()
        try {
          let res = await globalDB.put(a.doc)
          a.doc._rev = res.rev
        } catch (err) {
          console.error(err)
        }
      }
    }
  }
}
</script>

<style scoped>
.pagination-holder {
  margin-top: 10px;
  margin-bottom:  10px;
  justify-content: space-evenly;
  margin-left: 20px;
  margin-right: 20px;
}
.albums-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
#search-albums {
  margin: 10px;
  margin-bottom: 20px;
}

.albums-container {
  margin: 10px;
}

.album {
  width: 30%;
  height: 300px;
}
@media screen and (max-width: 480px) {
  .album {
    width: 100%;
  }
}

</style>
