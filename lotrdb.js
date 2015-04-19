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
  app.controller('tabController',[function(){
    this.tab=1;
    this.setTab = function(newValue){
      this.tab = newValue;
    };
    this.isSet = function(tabName){
      return this.tab === tabName;
    };
  }]);
  
  
  app.controller('init',['getData','$location','deck','cardObject','$scope',function(getData,$location,deck,cardObject,$scope){
    
    getData.async('cards.json').then(function(data) {
      for (d in data) {
        cardObject.push(data[d]);
      }
    });
    
    setTimeout( function() {
      var hashIndex = $location.url().indexOf('/#');
      if (hashIndex>-1){
        var encoded = $location.url().substr(hashIndex+2);
        var decoded = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded));
        deck.load(decoded,cardObject);
      }
      $scope.$apply();
    },1000);
  }]);
  
  
  //Page header
  app.directive('header', function() {
    return {
      restrict: 'E',
      templateUrl: 'header.html',
      controller: 'init'
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
  
  
  app.factory('cardObject',["getData",function(getData){
    var cardObject = [];
    return cardObject;
  }]);
  
  //Logic for the card selection
  app.controller('cardControl',["$http","$scope","filtersettings","deck","image","cardObject",function($http,$scope,filtersettings,deck,image,cardObject){
    $scope.allcards=[];
    $scope.deck=deck;
    this.image = image;
    this.filtersettings=filtersettings;
    this.order="sphere";
    $scope.allcards = cardObject;
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
  
  
  
  
  
  app.factory('deck', function(){
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
        };
      };
      return 0;
    };
    deck.startingThreat = function(){
      var threat = 0;
      for(var h in deck['1hero']){
        threat += deck['1hero'][h].cost;
      };
      return threat;
    };
    
    deck.countAllies = function(){
      var allies=0;
      for (var a in deck['2ally']) {
        allies += deck['2ally'][a].quantity;
      };
      return allies;
    };
    deck.countAttachments = function(){
      var attachments=0;
      for (var a in deck['3attachment']) {
        attachments += deck['3attachment'][a].quantity;
      };
      return attachments;
    };
    deck.countEvents = function(){
      var events=0;
      for (var e in deck['4event']) {
        events += deck['4event'][e].quantity;
      };
      return events;
    };
    deck.countQuests = function(){
      var quests=0;
      for (var q in deck['5quest']) {
        quests += deck['5quest'][q].quantity;
      };
      return quests;
    };
    deck.countHeroes = function(){
      var heroes=0;
      for (var h in deck['1hero']) {
        heroes += deck['1hero'][h].quantity;
      };
      return heroes;
    };
    
    deck.countTotal = function() {
      return deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests();
    };
    
    deck.empty = function() {
      return (deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests()+deck.countHeroes())==0;
    };
    
    deck.load = function(deckArray,cardObject,deckname) {
      if (Object.prototype.toString.apply(deckArray) == "[object Object]") {
        deck.deckname = deckname;
        deck.loadLegacy(deckArray);
        return 0;
        
      }
      deck['1hero']=[];
      deck['2ally']=[];
      deck['3attachment']=[];
      deck['4event']=[];
      deck['5quest']=[];
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
    };
    
    deck.loadLegacy = function(deckObject) {
      deck['1hero']=deckObject['1hero'];
      deck['2ally']=deckObject['2ally'];
      deck['3attachment']=deckObject['3attachment'];
      deck['4event']=deckObject['4event'];
      deck['5quest']=deckObject['5quest'];
    };
    
    
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
    image.text="";
    image.traits="";
    image.flavor="";
    image.update = function(card){
      image.url = card.img;
      image.name = card.name;
      image.exp = card.exp;
      image.text = card.text;
      image.traits = card.traits;
      image.flavor = card.flavor;
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
    this.alt = function() {
      return image.text;
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
  
  
  
  
  app.controller('myDecks',['deck','$localStorage','translate','$scope','cardObject','$location',function(deck,$localStorage,translate,$scope,cardObject,$location){
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
      var CompressedDeck=[deckname];
      CompressedDeck.name = deckname;
      var types = ["1hero","2ally","3attachment","4event","5quest"]
      for (var t in types){
        var type = types[t];
        for (var c in deck[type]){
          var card = deck[type][c];
          CompressedDeck.push([card.cycle,card.no,card.quantity]);
        }
      }
      $localStorage.decks[deckname] = {};
      $localStorage.decks[deckname].deck = CompressedDeck;
      $localStorage.decks[deckname].deckname = deckname;
      $localStorage.decks[deckname].dateUTC = new Date().valueOf().toString();
      
      var compressed = LZString.compressToEncodedURIComponent(JSON.stringify($localStorage.decks[deckname].deck));
      $location.url("/#"+compressed);
    };

    this.loadDeck = function(deckname) {
      deck.load($localStorage.decks[deckname].deck,cardObject,deckname);
      var compressed = LZString.compressToEncodedURIComponent(JSON.stringify($localStorage.decks[deckname].deck));
      $location.url("/#"+compressed);
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
    
    this.markdown = function(deckArray,deckname) {
      var deck={};
      deck["1hero"] = [];
      deck["2ally"] = [];
      deck["3attachment"] = [];
      deck["4event"] = [];
      deck["5quest"] = [];
      
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      
      var text="#";
      text+=deckname;
      text+="  \r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="  \r\n\r\n";
      if (deck["1hero"].length){
        text+="**Heroes** (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")  \r\n"
        for (var i in deck["1hero"]) {
          text+="    ";
          text+=deck["1hero"].sort(function(a,b){return a.name>b.name})[i].name;
          text+=" (*";
          text+=translate[deck["1hero"].sort(function(a,b){return a.name>b.name})[i].exp];
          text+="*)  \r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="**Allies**";
              break;
            case "3attachment":
              text+="**Attachments**";
              break;
            case "4event":
              text+="**Events**";
              break;
            case "5quest":
              text+="**Quests**";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")  \r\n"
          for (var i in deck[type]) {
            text+=" ";
            text+=deck[type].sort(function(a,b){return a.name>b.name})[i].quantity;
            text+="x ";
            text+=deck[type].sort(function(a,b){return a.name>b.name})[i].name;
            text+=" (*";
            text+=translate[deck[type].sort(function(a,b){return a.name>b.name})[i].exp];
            text+="*)  \r\n";
          }
        }
      }
      
      text+="***\r\n^Deck ^built ^with ^[Rivendell-Councilroom](http://github.com/ddddirk/lotrdb)";
      return text;
    }
    
    
    this.bbcode = function(deckArray,deckname) {
      var deck={};
      deck["1hero"] = [];
      deck["2ally"] = [];
      deck["3attachment"] = [];
      deck["4event"] = [];
      deck["5quest"] = [];
      
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      
      var text="[size=18]";
      text+=deckname;
      text+="[/size]\r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="  \r\n\r\n";
      if (deck["1hero"].length){
        text+="[b]Heroes[/b] (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")  \r\n"
        for (var i in deck["1hero"]) {
          text+="    ";
          text+=deck["1hero"].sort(function(a,b){return a.name>b.name})[i].name;
          text+=" ([i]";
          text+=translate[deck["1hero"].sort(function(a,b){return a.name>b.name})[i].exp];
          text+="[/i])  \r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="[b]Allies[/b]";
              break;
            case "3attachment":
              text+="[b]Attachments[/b]";
              break;
            case "4event":
              text+="[b]Events[/b]";
              break;
            case "5quest":
              text+="[b]Quests[/b]";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")  \r\n"
          for (var i in deck[type]) {
            text+=" ";
            text+=deck[type].sort(function(a,b){return a.name>b.name})[i].quantity;
            text+="x ";
            text+=deck[type].sort(function(a,b){return a.name>b.name})[i].name;
            text+=" ([i]";
            text+=translate[deck[type].sort(function(a,b){return a.name>b.name})[i].exp];
            text+="[/i])  \r\n";
          }
        }
      }
      
      text+="\r\n[size=7]Deck built with [url=http://github.com/ddddirk/lotrdb]Rivendell Councilroom[/url][/size]";
      return text;
    }
    
    

    
    this.downloadDeck = function(deckname){
      var deck= $localStorage.decks[deckname].deck;
      var text="++++++++++++\r\n+For Reddit+\r\n++++++++++++ \r\n\r\n";
      text+=this.markdown(deck,deckname);
      text+="\r\n\r\n\r\n\r\n\r\n+++++++++++++++++++ \r\n+For Boardgamegeek+\r\n+++++++++++++++++++  \r\n\r\n";
      text+=this.bbcode(deck,deckname);
      
      
      var CompressedDeck=$localStorage.decks[deckname].deck;
      
      
      text+="\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\nDo not remove the part below, you will be unable to upload the deck if you do!\r\n";
      text+="++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\r\n";
      text+=LZString.compressToEncodedURIComponent(JSON.stringify(CompressedDeck)).chunk(80).join("\r\n");
      text+="\r\n++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++";


      this.download(deckname+".txt",text);
    };

    this.uploadDeck = function(event) {
      var file = event.target.files[0];
      var deckname = file.name.replace('.txt','');
      var deck = this.currentdeck;
      if (file) {
        var r = new FileReader();
          r.onload = function(e) { 
          var contents = e.target.result.replace(/(\r\n|\n|\r)/gm,""); //strip newlines
          var encoded = contents.match(/\+{80}([A-Za-z0-9+\-\r\n]+)\+{80}/gm)[0];
          encoded = encoded.replace(/\+{80}/,"");
          var decoded = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded));
          deck.load(decoded,cardObject);
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
  
  
  
  app.directive('stats', function() {
    return {
      restrict: 'E',
      templateUrl: 'stats.html',
      controller: 'stats',
      controllerAs: 'stats'
    };
  });
  
  app.controller('stats',['deck',function(deck){
    this.sphereCanvas = document.getElementById("spheres").getContext("2d");
    this.costCanvas = document.getElementById("cost").getContext("2d");
    this.typeCanvas = document.getElementById("type").getContext("2d");
    
    this.filter = {sphere:null, cost:null, type:null};
    
    this.reloadDeck = function() {
      this.cards = [];
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var c in deck[type]) {
          var card = deck[type][c];
          for (var i = 0; i<card.quantity; i++){
            this.cards.push(card);
          }
        }
      }
      
    }
    
    this.reshuffle = function() {
      this.reloadDeck();
      function shuffle(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
      };
      shuffle(this.cards);
      this.hand = this.cards.slice(0,6);
      this.deck = this.cards.slice(6).reverse();
    };
    
    this.draw = function() {
      this.hand.push(this.deck.pop());
    }
    
    this.sphereSplit = function() {
      this.reloadDeck();
      var colors = ["purple","red","blue","green","grey","yellow","orange","lightgrey"];
      var split = [ {label:"Leadership", value: 0, color: colors[0]},
                    {label:"Tactics", value: 0, color: colors[1]},
                    {label:"Spirit", value: 0, color: colors[2]},
                    {label:"Lore", value: 0, color: colors[3]},
                    {label:"Neutral", value: 0, color: colors[4]},
                    {label:"Baggins", value: 0, color: colors[5]},
                    {label:"Fellowship", value: 0, color: colors[6]}];
      for (var c in this.cards) {
        if  ((this.filter.type==null || this.filter.type==this.cards[c].type)
          && (this.filter.cost==null || this.filter.cost==this.cards[c].cost)) {
          switch (this.cards[c].sphere) {
            case "1leadership":
              split[0].value++;
              break;
            case "2tactics":
              split[1].value++;
              break;
            case "3spirit":
              split[2].value++;
              break;
            case "4lore":
              split[3].value++;
              break;
            case "5neutral":
              split[4].value++;
              break;
            case "6baggins":
              split[5].value++;
              break;
            case "7fellowship":
              split[6].value++;
              break;
          }
        };
      }
      if (this.sphereChart) {
        this.sphereChart.destroy();
      }
      
      this.sphereChart = new Chart(this.sphereCanvas).Pie(split);
      parent = this;
      this.sphereCanvas.canvas.onclick = function(evt){
        var sphere = parent.sphereChart.getSegmentsAtEvent(evt)[0].label;
        if (sphere){
          
          parent.filter.type=null;
          parent.filter.cost=null;
          parent.sphereSplit();
          parent.sphereFilter(sphere,colors);
          parent.costSplit();
          parent.typeSplit();
        }
      };
    }
    
    this.costSplit = function() {
      this.reloadDeck();
      var split = {labels: ['0','1','2','3','4','5','6','X'],
                  datasets:[{label:"Cost",data:[0,0,0,0,0,0,0,0]}]};
      for (var c in this.cards) {
        if  ((this.filter.sphere==null || this.filter.sphere==this.cards[c].sphere)
          && (this.filter.type==null || this.filter.type==this.cards[c].type)) {
          var cost = this.cards[c].cost;
          console.log(cost);
          if (cost=="X"){
            split.datasets[0].data[7]++;
          } else{
            split.datasets[0].data[cost]++;
          }
        }
      }
      if (this.costChart) {
        this.costChart.destroy();
      }
      this.costChart = new Chart(this.costCanvas).Bar(split);
    }
    
    
    
    this.typeSplit = function() {
      this.reloadDeck();
      var colors = ["red","green","blue","yellow","lightgrey"];
      var split = [ {label:"Ally", value: 0, color: colors[0]},
                    {label:"Attachment", value: 0, color: colors[1]},
                    {label:"Event", value: 0, color: colors[2]},
                    {label:"Side Quest", value: 0, color: colors[3]}];
      for (var c in this.cards) {
        if  ((this.filter.sphere==null || this.filter.sphere==this.cards[c].sphere)
          && (this.filter.cost==null || this.filter.cost==this.cards[c].cost)) {
          switch (this.cards[c].type) {
            case "2ally":
              split[0].value++;
              break;
            case "3attachment":
              split[1].value++;
              break;
            case "4event":
              split[2].value++;
              break;
            case "5quest":
              split[3].value++;
              break;
          }
        }
      }
      if (this.typeChart) {
        this.typeChart.destroy();
      }
      this.typeChart = new Chart(this.typeCanvas).Pie(split);
      
      parent = this;
      this.typeCanvas.canvas.onclick = function(evt){
        var type = parent.typeChart.getSegmentsAtEvent(evt)[0].label;
        if (type){
          
          parent.filter.sphere=null;
          parent.filter.cost=null;
          parent.typeSplit();
          parent.typeFilter(type,colors);
          parent.sphereSplit();
          parent.costSplit();
        }
      };
    }
    
    
    this.refresh = function() {
      this.filter = {sphere:null, cost:null, type:null};
      this.sphereSplit();
      this.costSplit();
      this.typeSplit();
    }
    
    
    
    this.sphereFilter = function(_sphere,colors) {
      var sphere=null;
      var i;
      switch (_sphere) {
        case "Leadership":
          sphere = "1leadership";
          i=0;
          break;
        case "Tactics":
          sphere = "2tactics";
          i=1;
          break;
        case "Spirit":
          sphere = "3spirit";
          i=2;
          break;
        case "Lore":
          sphere = "4lore";
          i=3;
          break;
        case "Neutral":
          sphere = "5neutral";
          i=4;
          break;
        case "Baggins":
          sphere = "6baggins";
          i=5;
          break;
        case "Fellowship":
          sphere = "7fellowship";
          i=6;
          break;
      }
      if ((this.filter.sphere == sphere) || (sphere==null)) {
        this.filter.sphere = null;
        this.sphereChart.segments[0].fillColor = colors[0];
        this.sphereChart.segments[1].fillColor = colors[1];
        this.sphereChart.segments[2].fillColor = colors[2];
        this.sphereChart.segments[3].fillColor = colors[3];
        this.sphereChart.segments[4].fillColor = colors[4];
        this.sphereChart.segments[5].fillColor = colors[5];
        this.sphereChart.segments[6].fillColor = colors[6];
        this.sphereChart.segments[0]._saved.fillColor = colors[0];
        this.sphereChart.segments[1]._saved.fillColor = colors[1];
        this.sphereChart.segments[2]._saved.fillColor = colors[2];
        this.sphereChart.segments[3]._saved.fillColor = colors[3];
        this.sphereChart.segments[4]._saved.fillColor = colors[4];
        this.sphereChart.segments[5]._saved.fillColor = colors[5];
        this.sphereChart.segments[6]._saved.fillColor = colors[6];
      } else {
        this.filter.sphere = sphere;
        this.sphereChart.segments[0].fillColor = colors[7];
        this.sphereChart.segments[1].fillColor = colors[7];
        this.sphereChart.segments[2].fillColor = colors[7];
        this.sphereChart.segments[3].fillColor = colors[7];
        this.sphereChart.segments[4].fillColor = colors[7];
        this.sphereChart.segments[5].fillColor = colors[7];
        this.sphereChart.segments[6].fillColor = colors[7];
        this.sphereChart.segments[i].fillColor = colors[i];
        this.sphereChart.segments[0]._saved.fillColor = colors[7];
        this.sphereChart.segments[1]._saved.fillColor = colors[7];
        this.sphereChart.segments[2]._saved.fillColor = colors[7];
        this.sphereChart.segments[3]._saved.fillColor = colors[7];
        this.sphereChart.segments[4]._saved.fillColor = colors[7];
        this.sphereChart.segments[5]._saved.fillColor = colors[7];
        this.sphereChart.segments[6]._saved.fillColor = colors[7];
        this.sphereChart.segments[i]._saved.fillColor = colors[i];
      }
      
      return(this.sphereChart.update());
    }
    
    
    this.typeFilter = function(_type,colors) {
      var type=null;
      var i;
      switch (_type) {
        case "Ally":
          type = "2ally";
          i=0;
          break;
        case "Attachment":
          type = "3attachment";
          i=1;
          break;
        case "Event":
          type = "4event";
          i=2;
          break;
        case "Side Quest":
          type = "5quest";
          i=3;
          break;
      }
      if ((this.filter.type == type) || (type==null)) {
        this.filter.type = null;
        this.typeChart.segments[0].fillColor = colors[0];
        this.typeChart.segments[1].fillColor = colors[1];
        this.typeChart.segments[2].fillColor = colors[2];
        this.typeChart.segments[3].fillColor = colors[3];
        this.typeChart.segments[0]._saved.fillColor = colors[0];
        this.typeChart.segments[1]._saved.fillColor = colors[1];
        this.typeChart.segments[2]._saved.fillColor = colors[2];
        this.typeChart.segments[3]._saved.fillColor = colors[3];
      } else {
        this.filter.type = type;
        this.typeChart.segments[0].fillColor = colors[4];
        this.typeChart.segments[1].fillColor = colors[4];
        this.typeChart.segments[2].fillColor = colors[4];
        this.typeChart.segments[3].fillColor = colors[4];
        this.typeChart.segments[i].fillColor = colors[i];
        this.typeChart.segments[0]._saved.fillColor = colors[4];
        this.typeChart.segments[1]._saved.fillColor = colors[4];
        this.typeChart.segments[2]._saved.fillColor = colors[4];
        this.typeChart.segments[3]._saved.fillColor = colors[4];
        this.typeChart.segments[i]._saved.fillColor = colors[i];
      }
      
      return(this.typeChart.update());
    }
    
  }]);
  
  
  
  
  
  
  
  
  
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
