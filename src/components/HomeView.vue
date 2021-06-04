<template>
  <div class="hello">
    <h1>Welcome to Sylloge v.2 ALPHA</h1>
    <p>
      This is a work-in-progress rewrite of SyllogeApp for the browser and mobile devices.
    </p>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  props: {
    msg: String
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
