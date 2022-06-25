# sylloge-app

Sylloge App is an app to help coins collectors manage their collections.
The app lets you to store coin data in a dedicated format together with the pictures of obverse and reverse of the coin.
Coins can be organized in Albums, each coin can belong to multiple albums.

## History
The development of Sylloge-App started 2015. The app was developed as a mobile first app, and it was written using innovative hybrid technology for the time being. The development stack was Ionic framework and AngularJS. Unfortunately, the technology stack evolved too fast and continuing to use the new versions of Ionic+AngularJS would have implied the complete rewrite  of the app, from Javascript to Typescript. Since Typescript the author is not a fan of Typescript, the development temporarily stopped. 

The app is now being rewritting in pure ES6 + VueJs 3.

Data is persisted in using open source [PouchDB](https://pouchdb.com/). 

Realtime data synchronization is achived using a [Apache CouchDB server](https://couchdb.apache.org/). 


## Releases

Binary releases will be provided in GitHub and platform stores.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev 
```

### Compiles and minifies for production
```
npm run build
```
