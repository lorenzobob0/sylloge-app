import { createWebHashHistory, createRouter } from 'vue-router'
import HomeView from '../components/HomeView.vue'
import CoinsView from '../components/CoinsView.vue'
import CoinEditView from '../components/CoinEditView.vue'
import AlbumsView from '../components/AlbumsView.vue'
import AlbumEditView from '../components/AlbumEditView.vue'
import SettingsView from '../components/SettingsView.vue'
import NotFoundComponent from '../components/NotFoundComponent.vue'
import LoginComponent from '../components/LoginComponent.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/coins',
    name: 'Coins',
    component: CoinsView,
  },
  {
    path: '/coin_edit/:id',
    name: 'CoinEdit',
    component: CoinEditView,
    props: true,    
  },
  {
    path: '/albums',
    name: 'Albums',
    component: AlbumsView,
  },
  {
    path: '/album_edit/:id',
    name: 'AlbumEdit',
    component: AlbumEditView,
    props: true
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView
  },
  { 
    path: '/:pathMatch(.*)',
    name: 'not-found', 
    component: NotFoundComponent 
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginComponent
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  isAuthenticated : false,
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !router.isAuthenticated) next({ name: 'Login' })
  else next()
})

export default router;