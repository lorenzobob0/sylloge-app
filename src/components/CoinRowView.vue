<template>
  <el-card shadow="hover">
    <el-row :gutter="10">
      
      <el-col :span="4">
        <img class="img-thumb" style="max-width: 98%;" :src="coin.doc.imgObv" alt="obverse image"/>
      </el-col>
      <el-col :span="4">
        <img class="img-thumb" style="max-width: 98%;" :src="coin.doc.imgRev" alt="reverse image"/>
      </el-col>
      <el-col class="coin-desc" :span="16">
        {{coinToString(coin.doc)}}
      </el-col>

    </el-row>
  </el-card>
</template>

<script>
import ModelsAPI from './Models.js'

export default {
  name: 'CoinRowView',
  props: [
    'coin'
  ],
  data () {
    return {
    }
  },
  methods: {
    coinToString (coin) {
      return ModelsAPI.coinToString(coin)
    } 
  }
}
</script>

<style scoped>
.img-thumb {
  max-width: 98%;
}
.coin-desc {
  text-align: left;
}
</style>
