(function() {

  var app = angular.module('deckbuilder', ['ngStorage']);

  app.filter('toArray', function () {
    'use strict';

    return function (obj) {
      if (!(obj instanceof Object)) {
        return obj;
      }

      return Object.keys(obj).map(function (key) {
        return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
      });
    }
  });  
  
  app.factory('getData', function($http) {
    var promise;
    var getData = {
      async: function(file) {
        if ( !promise ) {
          // $http returns a promise, which has a then function, which also returns a promise
          promise = $http.get(file).then(function (response) {
            // The then function here is an opportunity to modify the response
            //console.log(response);
            // The return value gets picked up by the then in the controller.
            return response.data;
          });
        }
        // Return the promise to the controller
        return promise;
      }
    };
    return getData;
  });
  
  
  
  //Logic for the pack selection
  app.controller('packSelect',["filtersettings","$localStorage",function(filtersettings,$localStorage){
    this.filtersettings=filtersettings;
    this.full=["core", "kd", "hon", "tvoi", "tlr", "ohuh", "thfg", "trg", "tsf", "tdt", "twoe", "otd", "catc", "rtr", "tdf", "ttt", "efmg", "tbr", "ajtr", "twitw", "eaad", "tit", "trd", "thoem", "tld", "aoo", "tnie", "tdm", "fos", "tbog", "cs", "rtm", "saf", "tmv", "tac"]; //all expansions so far
    this.toggle=function(exp){
      var ind = this.filtersettings.pack.indexOf(exp);
      if (ind<0) { //index will be -1 if not found
        this.filtersettings.pack.push(exp);
      } else {
        this.filtersettings.pack.splice(ind,1);
      }
      $localStorage.pack = this.filtersettings.pack;
    };
    this.selectNone=function(){
      this.filtersettings.pack=[];
      $localStorage.pack = this.filtersettings.pack;
    };
    this.selectAll=function(){
      this.filtersettings.pack=this.full.slice(0); //make a clone
      $localStorage.pack = this.filtersettings.pack;
    };
  }]);
  
  app.directive('packs', function() {
    return {
      restrict: 'E',
      templateUrl: 'packs.html',
      controller: 'packSelect',
      controllerAs: 'packs'
    };
  });
  
  
  
  
  //Tabs in the right div
  app.controller('tabController',function(){
    this.tab=1;
    this.setTab = function(newValue){
      this.tab = newValue;
    };
    this.isSet = function(tabName){
      return this.tab === tabName;
    };
  });
  
  
  
  //Page header
  app.directive('header', function() {
    return {
      restrict: 'E',
      templateUrl: 'header.html'
    };
  });
  //Page footer
  app.directive('myfooter', function() {
    return {
      restrict: 'E',
      templateUrl: 'footer.html'
    };
  });
  
  app.filter('cardfilter', function(){
    return function (input, scope) {
      var output=[];
      for (i in input){
        if ((scope.filtersettings.pack.indexOf(input[i].exp)>=0)
          && (scope.filtersettings.type[input[i].type])
          && (scope.filtersettings.spheres[input[i].sphere]))
          {output.push(input[i]);};
      }
      return output;
    };
  });
  
  app.factory('filtersettings',["$localStorage",function ($localStorage) {
    var filtersettings={};
    filtersettings.pack= $localStorage.pack || ["core"];
    filtersettings.type={'1hero': true, '2ally': false, '3attachment': false, '4event': false, '5quest': false};
    filtersettings.spheres={'1leadership': true, '4lore': true, '3spirit': true, '2tactics': true, '5neutral': true, '6baggins':false, '7fellowship':false};
    return filtersettings;
  }]);
  
  
  //Logic for the card selection
  app.controller('cardControl',["$http","$scope","getData","filtersettings","deck","image",function($http,$scope,getData,filtersettings,deck,image){
    $scope.allcards=[];
    $scope.deck=deck;
    this.image = image;
    this.filtersettings=filtersettings;
    this.order="sphere";
    getData.async('cards.json').then(function(data) {
      for (d in data) {
        $scope.allcards.push(data[d]);
      }
    });
    this.allcards = $scope.allcards;
    this.toggleType = function(t){
      this.filtersettings.type[t] = !(this.filtersettings.type[t]);
    };
    this.toggleSphere = function(s){
      this.filtersettings.spheres[s] = !(this.filtersettings.spheres[s]);
    };
    this.orderby = function(o){
      this.order = o;
    };
    this.changepreview = function(card){
      this.image.update(card);
    }
  }]);
  
  app.directive('cards', function() {
    return {
      restrict: 'E',
      templateUrl: 'cards.html',
      controller: 'cardControl',
      controllerAs: 'cards'
    };
  });
  
  
  
  
  
  app.factory('deck',function(){
    var deck={};
    deck['1hero']=[];
    deck['2ally']=[];
    deck['3attachment']=[];
    deck['4event']=[];
    deck['5quest']=[];
    
    deck.change = function(card,quantity){
      if (quantity>0){
        if (deck.quantity(card)==0) {
          card.quantity=quantity;
          deck[card.type].push(card);
        } else {
          for (var c in deck[card.type]){
            if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
              deck[card.type][c].quantity = quantity;
            }
          }
        }
      } else {
        for (var c in deck[card.type]){
            if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
              deck[card.type].splice(c, 1);
            }
          }
      }
    };
    deck.quantity = function(card){
      for (var c in deck[card.type]){
        if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
          return deck[card.type][c].quantity;
        }
      }
      return 0;
    }
    deck.startingThreat = function(){
      var threat = 0;
      for(var h in deck['1hero']){
        threat += deck['1hero'][h].cost;
      }
      return threat;
    }
    
    deck.countAllies = function(){
      var allies=0;
      for (var a in deck['2ally']) {
        allies += deck['2ally'][a].quantity;
      }
      return allies;
    }
    deck.countAttachments = function(){
      var attachments=0;
      for (var a in deck['3attachment']) {
        attachments += deck['3attachment'][a].quantity;
      }
      return attachments;
    }
    deck.countEvents = function(){
      var events=0;
      for (var e in deck['4event']) {
        events += deck['4event'][e].quantity;
      }
      return events;
    }
    deck.countQuests = function(){
      var quests=0;
      for (var q in deck['5quest']) {
        quests += deck['5quest'][q].quantity;
      }
      return quests;
    }
    deck.countHeroes = function(){
      var heroes=0;
      for (var h in deck['1hero']) {
        heroes += deck['1hero'][h].quantity;
      }
      return heroes;
    }
    
    deck.countTotal = function() {
      return deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests();
    }
    
    deck.empty = function() {
      return (deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests()+deck.countHeroes())==0;
    }
    
    return deck;
  });
  
  app.controller('deckController',['$scope','deck','image',function($scope,deck,image){
    $scope.deck=deck;
    
    this.changepreview = function(card){
      image.update(card);
    }
  }]);
  
  app.directive('deck', function() {
    return {
      restrict: 'E',
      templateUrl: 'deck.html',
      controller: 'deckController',
      controllerAs: 'deckC'
    };
  });
  
  
  
  
  app.factory('image',function(){
    var image={};
    image.url="";
    image.name="";
    image.exp="";
    image.update = function(card){
      image.url = card.img;
      image.name = card.name;
      image.exp = card.exp;
    }
    image.getUrl = function(){
      return image.url;
    }
    return image;
  });
  
  
  app.controller('cardPreview',['$scope','image','translate',function($scope,image,translate){
    this.image=image;
    this.getImg = function() {
      return this.image.getUrl();
    };
    this.name = function() {
      return image.name + " (" + translate[image.exp] +")";
    }
  }]);
  
  app.directive('cardpreview', function() {
    return {
      restrict: 'E',
      templateUrl: 'cardpreview.html',
      controller: 'cardPreview',
      controllerAs: 'preview'
    };
  });
  
  
  
  
  app.controller('myDecks',['deck','$localStorage','translate','$scope',function(deck,$localStorage,translate,$scope){
    if (!$localStorage.decks){
      $localStorage.decks={};
    }
    this.decks = $localStorage.decks;
    this.currentdeck = deck;
    this.deckname="";

    this.numberOfDecks = function() {
      return Object.keys(this.decks).length;
    };

    this.saveDeck = function(deckname) {
      if (deck.empty()) {
        return alert('Deck is empty!');
      };
      if (this.currentdeck.deckname=="") {
        return alert('Please enter a name!');
      };
      if ($localStorage.decks[deckname]!=null){
        if (confirm('A deck by that name exists, overwrite?')) {
        } else{
          return 0;
        }
      }
      var newdeck = {};
      newdeck.deck = {};
        newdeck.deck["1hero"] = deck["1hero"].slice(0);
        newdeck.deck["2ally"] = deck["2ally"].slice(0);
        newdeck.deck["3attachment"] = deck["3attachment"].slice(0);
        newdeck.deck["4event"] = deck["4event"].slice(0);
        newdeck.deck["5quest"] = deck["5quest"].slice(0);
      newdeck.deckname = deckname;
      newdeck.dateUTC = new Date().valueOf().toString();
      newdeck.dateFormatted = new Date().toUTCString();
      $localStorage.decks[deckname] = newdeck;
    };

    this.loadDeck = function(deckname) {
      deck["1hero"] = $localStorage.decks[deckname].deck["1hero"].slice(0);
      deck["2ally"] = $localStorage.decks[deckname].deck["2ally"].slice(0);
      deck["3attachment"] = $localStorage.decks[deckname].deck["3attachment"].slice(0);
      deck["4event"] = $localStorage.decks[deckname].deck["4event"].slice(0);
      deck["5quest"] = $localStorage.decks[deckname].deck["5quest"].slice(0);
      deck.deckname = deckname;
    };

    $scope.loadDeck = this.loadDeck;

    this.deleteDeck = function(deckname) {
      if (confirm('Are you sure you want to delete this deck?')) {
        delete $localStorage.decks[deckname];
      };
    };

    this.clearDeck = function() {
      //if (deck.empty() || confirm('Are you sure you want to clear this deck?')) {
        deck["1hero"] = [];
        deck["2ally"] = [];
        deck["3attachment"] = [];
        deck["4event"] = [];
        deck["5quest"] = [];
        deck.deckname = "";
      //};
    };
    
    this.download = function(filename, text) {
      var pom = document.createElement('a');
      pom.setAttribute('href', 'data:text/plain;charset=utf-16,' + encodeURIComponent(text));
      pom.setAttribute('download', filename);

      pom.style.display = 'none';
      document.body.appendChild(pom);

      pom.click();

      document.body.removeChild(pom);
    }

    String.prototype.chunk = function(n) {
      var ret = [];
      for(var i=0, len=this.length; i < len; i += n) {
       ret.push(this.substr(i, n))
      }
      return ret
    };

    
    this.downloadDeck = function(deckname){
      var text="";
      var deck= $localStorage.decks[deckname].deck;
      text+=deckname;
      text+="\r\n\r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="\r\n\r\n";
      if (deck["1hero"].length){
        text+="Heroes (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")\r\n"
        for (var i in deck["1hero"]) {
          text+="  * ";
          text+=deck["1hero"][i].name;
          text+=" (";
          text+=translate[deck["1hero"][i].exp];
          text+=")\r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="Allies";
              break;
            case "3attachment":
              text+="Attachments";
              break;
            case "4event":
              text+="Events";
              break;
            case "5quest":
              text+="Quests";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")\r\n"
          for (var i in deck[type]) {
            text+=" ";
            text+=deck[type][i].quantity;
            text+="x ";
            text+=deck[type][i].name;
            text+=" (";
            text+=translate[deck[type][i].exp];
            text+=")\r\n";
          }
        }

      }

      text+="\r\n\r\n\r\n\r\nDo not remove the part below, or you will be unable to upload the deck!\r\n";
      text+="++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\r\n";
      text+=LZString.compressToEncodedURIComponent(JSON.stringify($localStorage.decks[deckname])).chunk(80).join("\r\n");
      text+="\r\n++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++";


      this.download(deckname+".txt",text);
    };

    this.uploadDeck = function(event) {
      var file = event.target.files[0];
      var deckname = file.name.replace('.txt','');
      if (file) {
        var r = new FileReader();
        r.onload = function(e) { 
          var contents = e.target.result.replace(/(\r\n|\n|\r)/gm,""); //strip newlines
          var encoded = contents.match(/\+{80}([A-Za-z0-9+\-\r\n]+)\+{80}/gm)[0];
          encoded = encoded.replace(/\+{80}/,"");
          var newdeck = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded));
          newdeck.deckname = deckname;
          newdeck.dateUTC = new Date().valueOf().toString();
          newdeck.dateFormatted = new Date().toUTCString();
          if ($localStorage.decks[deckname]!=null){
            if (confirm('A deck by that name exists, overwrite?')) {
            } else{
              return 0;
            }
          }
          $localStorage.decks[deckname] = newdeck;
          $scope.loadDeck(deckname);
          $scope.$apply();
        };
        r.readAsText(file);
      };
    };
  }]);
  
  
  
  app.directive('mydecks', function() {
    return {
      restrict: 'E',
      templateUrl: 'mydecks.html',
      controller: 'myDecks',
      controllerAs: 'mydecks'
    };
  });
  
  
  
  
  
  
  
  
  
  
  
  app.factory('translate',function(){
    var translate={};
    translate[""]="";
    translate.core="Core Set";
    translate.kd=unescape("Khazad-D%FBm");
    translate.hon=unescape("Heirs of N%FAmenor");
    translate.tvoi="The Voice of Isengard";
    translate.tlr="The Lost Realm";
    translate.ohuh="Over Hill and Under Hill";
    translate.thfg="The Hunt for Gollum";
    translate.trg="The Redhorn Gate";
    translate.tsf="The Steward's Fear";
    translate.tdt="The Dunland Trap";
    translate.twoe="The Wastes of Eriador";
    translate.otd="On the Doorstep";
    translate.catc="Conflict at the Carrock";
    translate.rtr="Road to Rivendell";
    translate.tdf=unescape("The Dr%FAadan Forest");
    translate.ttt="The Three Trials";
    translate.efmg="Escape from Mount Gram";
    translate.tbr="The Black Riders";
    translate.ajtr="A Journey to Rhosgobel";
    translate.twitw="The Watcher in the Water";
    translate.eaad=unescape("Encounter at Amon D%EEn");
    translate.tit="Trouble in Tharbad";
    translate.trd="The Road Darkens";
    translate.thoem="The Hills of Emyn Muil";
    translate.tld="The Long Dark";
    translate.aoo="Assault on Osgiliath";
    translate.tnie="The Nin-in-Eilph";
    translate.tdm="The Dead Marshes";
    translate.fos="Foundations of Stone";
    translate.tbog="The Blood of Gondor";
    translate.cs="Celebrimbor's Secret";
    translate.rtm="Return to Mirkwood";
    translate.saf="Shadow and Flame";
    translate.tmv="The Morgul Vale";
    translate.tac="The Antlered Crown";
    translate.ttos="The Treason of Saruman";
    return translate;
  });
  

})();
