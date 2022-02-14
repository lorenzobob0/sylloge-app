import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/index.css'
import 'element-plus/es/components/message/style/css'
import './assets/global.css'

import './orm.js/lib/persistence.js'
//import './orm.js/lib/persistence.store.sql.js'
//import './orm.js/lib/persistence.store.websql.js'
import './orm.js/lib/persistence.store.memory.js'
import './orm.js/lib/persistence.migrations.js'
import './orm.js/lib/persistence.sync.js'
//import './orm.js/lib/persistence.search.js'

//import ModelsAPI from './components/Models.js'
//ModelsAPI.initDB()

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

