<template>
  <div class="albums">
    <el-row>
      <el-col :span="18">
        <el-input placeholder="Search albums" v-model="searchTerms" ></el-input>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" icon="el-icon-search" @click="updateFilter">Search</el-button>  
      </el-col>
      <el-col :span="2">
        <el-button type="success" icon="el-icon-plus" @click="addNewItem"></el-button>  
      </el-col>      
    </el-row>

    <div class="pagination-holder">
    </div>
    <draggable class="albums-container dragArea list-group w-full" :list="albums" @change="persistOrder">
      <album-row-view v-for="album in albums" :key="album.id" :album="album" @edit="editAlbum(album)" @view="viewAlbum(album)" ></album-row-view>
    </draggable>  
    
  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import AlbumRowView from './AlbumRowView.vue'
import { VueDraggableNext } from 'vue-draggable-next'

export default {
  name: 'AlbumsView',
  components: {
    'album-row-view': AlbumRowView,
    'draggable': VueDraggableNext
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
        coinType: 'New entry'
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
}
.albums-container {
  display: flex;
  flex-wrap: wrap;
}
</style>
