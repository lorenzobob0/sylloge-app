<template>
  <div class="home">
    <sylloge-menu :homeIndex="1" />
    <h1>Welcome to Sylloge version {{version}}</h1>
    <p v-if="updateAvailable">
      A new update is avialable ({{latestRelease}}). <br/>
      <a :href="'https://github.com/lorenzobob0/sylloge-app/releases/tag/'+latestRelease" target="_blank">Download page</a>
    </p>
    <p>
      This is a work-in-progress rewrite and enhancement of 
      SyllogeApp for desktops and mobile devices.
    </p>
  </div>
</template>

<script>
import SylllogeMenu from './SylllogeMenu.vue'
import { checkLatestVersion, syllogeVersion } from './version'

export default {
  name: 'HomeView',
  components: {
    'sylloge-menu': SylllogeMenu
  },
  props: {
    msg: String
  }, 
  data: function () {
    return {
      version: syllogeVersion(),
      updateAvailable: false,
      latestRelease: ''
    }
  },
  async mounted() {
    let v = await checkLatestVersion()
    if (v > VERSION) {
      this.updateAvailable = true
      this.latestRelease = v
    }
  },
  methods: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
