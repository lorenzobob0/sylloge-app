let hasBlobConstructor = typeof Blob !== 'undefined' && function () {
  try {
    return Boolean(new Blob());
  } catch (e) {
    return false;
  }
}()

let hasArrayBufferViewSupport = hasBlobConstructor && typeof Uint8Array !== 'undefined' && function () {
  try {
    return new Blob([new Uint8Array(100)]).size === 100;
  } catch (e) {
    return false
  }
}()

let hasToBlobSupport = typeof HTMLCanvasElement !== "undefined" ? HTMLCanvasElement.prototype.toBlob : false
let hasBlobSupport = hasToBlobSupport || typeof Uint8Array !== 'undefined' && typeof ArrayBuffer !== 'undefined' && typeof atob !== 'undefined'
let hasReaderSupport = typeof FileReader !== 'undefined' || typeof URL !== 'undefined'

export default class ImageTools {
  /**
   * Convert a base64 string in a Blob according to the data and contentType.
   * 
   * @param b64Data {String} Pure base64 string without contentType
   * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
   * @param sliceSize {Int} SliceSize to process the byteCharacters
   * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
   * @return Blob
   */
  static b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  /**
   * Converts any image to JPG
   * @param {string} img URL of the image
   * @returns a promise, on resolve a jpeg image blob
   */
  static img2jpgBlob(img) {
    return new Promise(function (resolve, reject) {
      let imageElem = document.createElement('img')
      imageElem.onload = function () {
        let c = document.createElement("canvas")  // create a temp. canvas
        let ctx = c.getContext("2d")
        c.width = imageElem.width;                      // set size = image, draw
        c.height = imageElem.height;
        ctx.drawImage(imageElem, 0, 0);
    
        // convert to File object, NOTE: we're using binary mime-type for the final Blob/File
        c.toBlob(function(blob) {
          resolve(blob)
        }, "image/jpeg", 1.0);  // mime=JPEG, quality=100%
    
      }
      imageElem.src = URL.createObjectURL(img)
    })

  }

  static resize(file, maxWidth = 640, maxHeight = 480) {
    return new Promise(function (resolve, reject) {
      
  
      if (!ImageTools.isSupported() || !file.type.match(/image.*/)) {
        reject(file)
        return false
      }
  
      if (file.type.match(/image\/gif/)) {
        // Not attempting, could be an animated gif
        reject(file) // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
      }
  
      let image = document.createElement('img')
  
      image.onload = function () {
        let width = image.width
        let height = image.height
        let isTooLarge = false
  
        if (width >= height && width > maxWidth) {
          // width is the largest dimension, and it's too big.
          height *= maxWidth / width
          width = maxWidth
          isTooLarge = true
        } else if (height > maxHeight) {
          // either width wasn't over-size or height is the largest dimension
          // and the height is over-size
          width *= maxHeight / height
          height = maxHeight
          isTooLarge = true
        }
  
        if (!isTooLarge) {
          // early exit; no need to resize
          reject(file)
        }
  
        let canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        let ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, width, height)
  
        if (hasToBlobSupport) {
          canvas.toBlob(blob => {
            resolve(blob)
          }, file.type)
        } else {
          let blob = ImageTools._toBlob(canvas, file.type) 
          resolve(blob)
        }
      };
  
      ImageTools._loadImage(image, file)
  
    })
  }

  static _toBlob(canvas, type) {
    let dataURI = canvas.toDataURL(type);
    let dataURIParts = dataURI.split(',');
    let byteString;

    if (dataURIParts[0].indexOf('base64') >= 0) {
      // Convert base64 to raw binary data held in a string:
      byteString = atob(dataURIParts[1]);
    } else {
      // Convert base64/URLEncoded data component to raw binary data:
      byteString = decodeURIComponent(dataURIParts[1]);
    }

    let arrayBuffer = new ArrayBuffer(byteString.length);
    let intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i += 1) {
      intArray[i] = byteString.charCodeAt(i);
    }

    let mimeString = dataURIParts[0].split(':')[1].split(';')[0];
    let blob = null;

    if (hasBlobConstructor) {
      blob = new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
        type: mimeString
      });
    } else {
      // The BlobBuilder API has been deprecated in favour of Blob, but older
      // browsers don't know about the Blob constructor
      // IE10 also supports BlobBuilder, but since the `Blob` constructor
      //  also works, there's no need to add `MSBlobBuilder`.
      var BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;
      let bb = new BlobBuilder();
      bb.append(arrayBuffer);
      blob = bb.getBlob(mimeString);
    }

    return blob;
  }

  static _loadImage(image, file, callback) {
    if (typeof URL === 'undefined') {
      let reader = new FileReader();

      reader.onload = function (evt) {
        image.src = evt.target.result;

        if (callback) {
          callback();
        }
      };

      reader.readAsDataURL(file);
    } else {
      image.src = URL.createObjectURL(file);

      if (callback) {
        callback();
      }
    }
  }

  static isSupported() {
    return typeof HTMLCanvasElement !== 'undefined' && hasBlobSupport && hasReaderSupport;
  }

}

