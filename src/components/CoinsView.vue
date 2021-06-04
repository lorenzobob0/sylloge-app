<template>
  <div class="hello">
    <el-row>
      <el-col :span="18">
        <el-input placeholder="Search your coins" v-model="searchTerms" ></el-input>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" icon="el-icon-search" @click="updateFilter">Search</el-button>  
      </el-col>
      <el-col :span="2">
        <el-button type="success" icon="el-icon-plus" @click="addNewItem"></el-button>  
      </el-col>
    </el-row>
    <div class="pagination-holder">
      <el-pagination background
        layout="total, sizes, prev, pager, next"
        :total="pagination.totalResults" 
        :current-page="pagination.curPage"
        :page-sizes="[20, 50, 100, 200]"
        :page-size="rpp"
        @size-change="handleSizeChange"
        @current-change="handleCurrentPageChange" ></el-pagination>
    </div>
    <coin-row-view v-for="coin in coins" :key="coin.id" :coin="coin" @click="editCoin(coin)"></coin-row-view>
    
    
    <div class="pagination-holder">
      <el-pagination 
        v-if="pagination.totalResults > 0"
        background
        layout="total, sizes, prev, pager, next"
        :total="pagination.totalResults" 
        :current-page="pagination.curPage"
        :page-sizes="[20, 50, 100, 200]"
        :page-size="rpp"
        @size-change="handleSizeChange"
        @current-change="handleCurrentPageChange" ></el-pagination>
    </div>
  </div>
</template>

<script>
import ModelsAPI from './Models.js'
import CoinRowView from './CoinRowView.vue'

export default {
  name: 'CoinsView',
  components: {
    'coin-row-view': CoinRowView
  },
  data () {
    return {
      searchTerms: '',
      rpp: 20,
      pagination: {
        curPage: 1,
        numPages: 0,
        totalResults: 0,
      },
      coins: {}
    }
  },
  mounted() {
    this.initComponent()
  },
  methods: {
    handleSizeChange (val) {
      this.rpp = parseInt(val)
      localStorage.setItem('pagination_resultsPerPage', this.rpp);
      this.fetchCoins()
    },
    handleCurrentPageChange (page) {
      this.pagination.curPage = page
      this.fetchCoins()
    },
    async fetchCoins () {
      const self = this
      let globalDB = await ModelsAPI.initDB()

      /*
      var myPopup = $ionicPopup.show({
        template: 'Please wait...',
        title: 'Loading...',
        scope: $scope,
        buttons: []
      });
      */

      let allCoins = await globalDB.find({
        selector: {
          type: 'Coin'
        }
      })
      // Ordina
      allCoins.docs.sort(function (a, b) {
        let dateA = a.creationDate
        if (dateA == null) {
          dateA = new Date('1970-01-01T00:25:41.000Z')
        }
        let dateB = b.creationDate
        if (dateB == null) {
          dateB = new Date('1970-01-01T00:25:41.000Z')
        }
        return new Date(dateA) < new Date(dateB)
      })

      let filteredCoins = allCoins.docs
      if (self.searchTerms != '' && self.searchTerms != null) {
        filteredCoins = allCoins.docs.filter(function (c) {
          return ModelsAPI.coinToString(c).toLowerCase().indexOf(self.searchTerms.toLowerCase()) > -1
        })
      }
      let keys = []
      for (let i = 0; i < filteredCoins.length; i++) {
        keys.push(filteredCoins[i]._id)
      }


      // Pagina
      self.pagination.totalResults = allCoins.docs.length;
      self.pagination.numPages = Math.ceil(self.pagination.totalResults / self.rpp);


      allCoins = await globalDB.allDocs({
        include_docs: true,
        keys: keys.splice((self.pagination.curPage-1) * self.rpp, Math.min(keys.length, (self.pagination.curPage) * self.rpp)),
        attachments: false,
      })
      for (let i = 0; i < allCoins.rows.length; i++) {
        let c = allCoins.rows[i].doc
        if (typeof c._attachments !== 'undefined') {
          if (typeof c._attachments.imgObv !== 'undefined') {
            let atc = await globalDB.getAttachment(c._id, 'imgObv')
            let url = URL.createObjectURL(atc);
            c.imgObv = url
          }
          if (typeof c._attachments.imgRev !== 'undefined') {
            let atc = await globalDB.getAttachment(c._id, 'imgRev')
            let url = URL.createObjectURL(atc);
            c.imgRev = url
          }
        }
      }
      self.coins = allCoins.rows
    },
    initComponent () {
      const self = this
      self.rpp = parseInt(localStorage.getItem('pagination_resultsPerPage'));
      if (self.rpp == 0 || self.rpp == null || self.rpp == undefined || self.rpp == 'undefined') {
        self.rpp = 20;
        localStorage.setItem('pagination_resultsPerPage', self.rpp);
      }

      self.pagination = {
        curPage: 1,
        numPages: 0,
        totalResults: 0,
        prevDisabled: true,
        nextDisabled: true,
      }

      self.fetchCoins()
    },
    editCoin (coin) {
      this.$router.push('/coin_edit/' + coin.id)
    },
    updateFilter () {
      this.fetchCoins()
    },
    async addNewItem () {
      let c = {
        type: 'Coin',
        creationDate: new Date(),
        coinType: 'New entry'
      }

      try {
        let globalDB = await ModelsAPI.initDB()
        let doc = await globalDB.post(c)
        console.log(doc)
        this.$router.push('/coin_edit/'+ doc.id );
      } catch (err) {
        console.error(err)
      }
    }
  }
}
</script>

<style scoped>
.pagination-holder {
  margin-top: 10px;
  margin-bottom:  10px;
}
</style>
