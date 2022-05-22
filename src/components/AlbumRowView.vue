<template>
  <el-card class="album" shadow="hover">
    <img v-if="cover" class="album-cover image" :src="cover">
    <div v-else class="album-cover image ">
      <i v-if="true" class="el-icon-picture-outline" />
    </div>
    <el-row :gutter="10">
      <el-col class="album-desc" :span="20">
        <p class="album-name">
          {{album.doc.name}}
        </p>
        <p class="album-description">
          {{album.doc.albumDescription}}
        </p>
        <p v-if="album.doc.coins">
          Coins: {{album.doc.coins.length}}
        </p>
        <p v-else> 
          No coins in this album
        </p>
        <p>
          Last modified: {{elapsedTimeSinceLastEdit}}
        </p>
      </el-col>
      <!--
      <el-col :span="2">
        <el-button type="primary" circle @click="$emit('edit', album)">
          <el-icon><edit-pen /></el-icon>
        </el-button>
      </el-col>
      -->
      <el-col :span="2">
        <el-button type="success" circle @click="$emit('view', album)">
          <el-icon><folder-opened /></el-icon>
        </el-button>
      </el-col>

    </el-row>
  </el-card>
</template>

<script>
import ModelsAPI from './Models.js'
import moment from 'moment'
import { FolderOpened, EditPen } from '@element-plus/icons-vue'

export default {
  name: 'AlbumRowView',
  components: {
    FolderOpened, EditPen
  },
  props: [
    'album'
  ],
  emits: [
    /*'view', */
    'edit'
  ],
  data () {
    return {
      cover: null
    }
  },
  async mounted () {
    const self = this
    let globalDB = await ModelsAPI.initDB()
    
    if (typeof self.album.doc._attachments !== 'undefined' && typeof self.album.doc._attachments.cover !== 'undefined') {
      let atc = await globalDB.getAttachment(self.album._id, 'cover')
      let url = URL.createObjectURL(atc)
      self.cover = url
    }

  },
  methods: {
     
  },
  computed: {
    elapsedTimeSinceLastEdit () {
      return moment(this.album.doc.lastModified).startOf().fromNow()
    }
  }
}
</script>

<style scoped>

.album-description {
  white-space: pre;
}
.album-cover {
  max-width: 290px;
  max-height: 100px;
}

.album-name {
  font-weight: bold;
}
.img-thumb {
  max-width: 98%;
}
.album-desc {
  text-align: left;
}
</style>
