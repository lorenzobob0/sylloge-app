<template>
  <div>
    <el-upload
      drag
      class="img-uploader"
      :show-file-list="false"
      :on-success="updateImg"
      :auto-upload="true"
      :before-upload="updateImg"
    >
      <img class="img" v-if="img" :src="img" />
      <i v-else class="el-icon-plus img-uploader-icon"></i>
    </el-upload>
    <div>
      <el-button type="info" icon="el-icon-view" @click="imageViewerVisible = true" />
      <el-button type="info" icon="el-icon-download" @click="downloadAsFile()" />
      <el-button type="danger" icon="el-icon-delete" @click="deleteImage()" />
    </div>

    <el-dialog
      v-model="imageViewerVisible"
      width="98%">
      <img style="width: 100%;" :src="img" />
    </el-dialog>

  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import ImageTools from './ImageTools.js'

export default {
  name: 'ImageFieldView',
  props: {
    img: String
  },
  emits: [
    'changed'
  ],
  data () {
    return {
      imageViewerVisible: false
    }
  },
  methods: {
    async updateImg (file) {
      const self = this
      let blob = file
      const globalDB = await ModelsAPI.initDB()
      
      try {
        if (file.type != 'image/jpeg') {
          blob = await ImageTools.img2jpgBlob(file)
          file = URL.createObjectURL(blob)
        }
        blob = await ImageTools.resize(file, {
          width: 1080, // maximum width
          height: 1080 // maximum height
        })
      } catch (err) {
        console.log(err)
      }
      
      var reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onload = async function (e) {
        var data = e.target.result
        if (data.startsWith('data:image/jpeg;base64,')) {
          data = data.substring('data:image/jpeg;base64,'.length)
          const datablob = ImageTools.b64toBlob(data)
          self.$emit('changed', datablob)
        } else {
          self.$message.error('Not a JPG image!')
        }
      }
      // return false
    },
    downloadAsFile () {
      const contentType = 'image/jpeg';

      let e = document.createEvent('MouseEvents')
      let a = document.createElement('a')
      a.download = 'image.jpg'
      a.href = this.img
      a.dataset.downloadurl =  [contentType, a.download, a.href].join(':')
      e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      a.dispatchEvent(e)
    },
    deleteImage () {
      //this.img = null
      this.$emit('changed', null)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.img-uploader  {
  border-style: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100% !important;
}
.img-uploader .el-upload:hover {
  border-style: none;
}
.img-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.img {
  width: 100%;
}  

</style>
