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
  app.controller('packSelect',function(){
    this.pack=["core"];
    this.full=["core", "kd", "hon", "tvoi", "tlr", "ohuh", "thfg", "trg", "tsf", "tdt", "twoe", "otd", "catc", "rtr", "tdf", "ttt", "efmg", "tbr", "ajtr", "twitw", "eaad", "tit", "trd", "thoem", "tld", "aoo", "tnie", "tdm", "fos", "tbog", "cs", "rtm", "saf", "tmv", "tac"]; //all expansions so far
    this.toggle=function(exp){
      var ind = this.pack.indexOf(exp);
      if (ind<0) { //index will be -1 if not found
        this.pack.push(exp);
      } else {
        this.pack.splice(ind,1);
      }
    };
    this.selectNone=function(){
      this.pack=[];
      PACKS=this.pack; //global variable hack
    };
    this.selectAll=function(){
      this.pack=this.full.slice(0); //make a clone
      PACKS=this.pack; //global variable hack
    };
    PACKS=this.pack;
  });
  
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
  
  
  
  app.filter('cardfilter', function () {
    return function (input, scope) {
      var output=[];
      for (i in input){
        if ((PACKS.indexOf(input[i].exp)>=0)
          && (scope.hero||input[i].type!='hero')
          && (scope.ally||input[i].type!='ally')
          && (scope.attachment||input[i].type!='attachment')
          && (scope.event||input[i].type!='event'))
          {output.push(input[i]);};
      }
      return output;
    };
  });
  
  
  //Logic for the card selection
  app.controller('cardControl',["$http","$scope","getData",function($http,$scope,getData){
    $scope.allcards=[];
    this.hero=true;
    this.ally=false;
    this.attachment=false;
    this.event=false;
    this.order="sphere";
    getData.async('cards.json').then(function(data) {
      for (d in data) {
        $scope.allcards.push(data[d]);
      }
    });
    this.allcards = $scope.allcards;
    this.toggleHero = function(){
      this.hero= !(this.hero);
    };
    this.toggleAlly = function(){
      this.ally= !(this.ally);
    };
    this.toggleAttachment = function(){
      this.attachment= !(this.attachment);
    };
    this.toggleEvent = function(){
      this.event= !(this.event);
    };
    this.orderby = function(o){
      this.order = o;
    };
  }]);
  
  app.directive('cards', function() {
    return {
      restrict: 'E',
      templateUrl: 'cards.html',
      controller: 'cardControl',
      controllerAs: 'cards'
    };
  });

})();
