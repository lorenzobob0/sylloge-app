<template>
  <el-container>
    <el-container id="main-container">
      <el-main style="padding-bottom: 60px">
        <router-view></router-view>
      </el-main>
      <el-footer id="footer">
        <el-tabs tab-position="bottom" @tab-click="handleTabClick" >
          <el-tab-pane >
            <template #label>
              <i class="el-icon-s-home"></i> Home
            </template>
          </el-tab-pane>
          <el-tab-pane >
            <template #label>
              <i class="el-icon-coin"></i> My Coins
            </template>
          </el-tab-pane>
          
          <el-tab-pane >
            <template #label>
              <i class="el-icon-folder-opened"></i> Albums
            </template>
          </el-tab-pane>
          <el-tab-pane >
            <template #label>
              <i class="el-icon-setting"></i> Settings
            </template>
          </el-tab-pane>
        </el-tabs>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script>
import HomeView from './components/HomeView.vue'
import CoinsView from './components/CoinsView.vue'

export default {
  name: 'App',
  components: {
    'home-view': HomeView,
    'coins-view': CoinsView,
  }, 
  methods: {
    handleTabClick (tabElem) {
      console.log(tabElem.index)
      switch(parseInt(tabElem.index)) {
        case 0:
          this.$router.push('/')
          break;
        case 1:
          this.$router.push('/coins')
          break;
        case 2:
          this.$router.push('/albums')
          break;
        case 3:
          this.$router.push('/settings')
          break;
        default:
          break
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

textarea {
  font-family: Arial;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#footer {
  height: 60px;
  position: fixed;
  bottom: 0px;
  left: 0;
  right: 0;
  z-index: 2000;
  background-color: #fff;
  border-top-style: solid;
  border-top-width: 1px;
  border-top-color: #ddd;
  display: flex;
  justify-content: center;
}
</style>
