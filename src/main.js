import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/index.css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/theme-chalk/display.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

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

import vex from 'vex-js'
import vexDialog from 'vex-dialog'
import 'vex-js/dist/css/vex.css'
import 'vex-js/dist/css/vex-theme-default.css'
import 'vex-js/dist/css/vex-theme-os.css'
vex.defaultOptions.className = 'vex-theme-default'
vex.registerPlugin(vexDialog)

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

