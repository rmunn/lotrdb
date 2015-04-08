(function() {

  var app = angular.module('deckbuilder', []);
  
  
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
  app.controller('packSelect',["filtersettings",function(filtersettings){
    this.filtersettings=filtersettings;
    this.full=["core", "kd", "hon", "tvoi", "tlr", "ohuh", "thfg", "trg", "tsf", "tdt", "twoe", "otd", "catc", "rtr", "tdf", "ttt", "efmg", "tbr", "ajtr", "twitw", "eaad", "tit", "trd", "thoem", "tld", "aoo", "tnie", "tdm", "fos", "tbog", "cs", "rtm", "saf", "tmv", "tac"]; //all expansions so far
    this.toggle=function(exp){
      var ind = this.filtersettings.pack.indexOf(exp);
      if (ind<0) { //index will be -1 if not found
        this.filtersettings.pack.push(exp);
      } else {
        this.filtersettings.pack.splice(ind,1);
      }
    };
    this.selectNone=function(){
      this.filtersettings.pack=[];
    };
    this.selectAll=function(){
      this.filtersettings.pack=this.full.slice(0); //make a clone
    };
  }]);
  
  app.directive('packs', function() {
    return {
      restrict: 'E',
      templateUrl: 'packs.html',
      //controller: 'packSelect',
      //controllerAs: 'packs'
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
  
  app.factory('filtersettings', function () {
    var filtersettings={};
    filtersettings.pack=["core"];
    filtersettings.type={'1hero': true, '2ally': false, '3attachment': false, '4event': false};
    filtersettings.spheres={'1leadership': true, '4lore': true, '3spirit': true, '2tactics': true, '5neutral': true, '6baggins':false, '7fellowship':false};
    return filtersettings;
  });
  
  
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
    
    deck.countTotal = function() {
      return deck.countAllies()+deck.countAttachments()+deck.countEvents();
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
    image.update = function(card){
      image.url = card.img;
    }
    image.getUrl = function(){
      return image.url;
    }
    return image;
  });
  
  
  app.controller('cardPreview',['$scope','image',function($scope,image){
    this.image=image;
    this.getImg = function() {
      return this.image.getUrl();
    };
  }]);
  
  app.directive('cardpreview', function() {
    return {
      restrict: 'E',
      templateUrl: 'cardpreview.html',
      controller: 'cardPreview',
      controllerAs: 'preview'
    };
  });
  

})();
